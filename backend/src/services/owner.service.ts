import { Types } from 'mongoose';
import { Property, type PropertyAttrs } from '../models/Property';
import { Booking, ACTIVE_BOOKING_STATUSES, type BookingStatus } from '../models/Booking';
import { getOccupancyMap, type OccupancyInfo } from './availability.service';
import { AppError } from '../utils/errors';
import { getSkip } from '../utils/pagination';
import { startOfTodayUtc } from '../utils/dates';
import { cacheAside } from '../cache/cache';
import { cacheKeys, TTL } from '../cache/keys';

export interface BookingsByStatus {
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export interface OwnerDashboardMetrics {
  totalProperties: number;
  activeProperties: number;
  inactiveProperties: number;
  totalBookings: number;
  bookingsByStatus: BookingsByStatus;
  upcomingBookings: number;
  occupiedNow: number;
  totalRevenue: number;
}

export interface OwnerPropertyItem extends PropertyAttrs {
  occupancy: OccupancyInfo;
}

interface PropertyGroupRow {
  _id: boolean | null;
  count: number;
}

interface BookingFacetResult {
  byStatus: { _id: BookingStatus; count: number }[];
  upcoming: { count: number }[];
  revenue: { total: number }[];
  occupiedNow: { count: number }[];
}

const EMPTY_FACET: BookingFacetResult = { byStatus: [], upcoming: [], revenue: [], occupiedNow: [] };

// Run parallel aggregation pipelines over Property and Booking
async function computeOwnerDashboard(ownerId: string): Promise<OwnerDashboardMetrics> {
  const owner = new Types.ObjectId(ownerId);
  const today = startOfTodayUtc();

  const [propertyRows, facets] = await Promise.all([
    // Group properties by active status
    Property.aggregate<PropertyGroupRow>([
      { $match: { owner } },
      { $group: { _id: '$isActive', count: { $sum: 1 } } },
    ]),
    // Compute status counts, upcoming stays, and revenue in one pass
    Booking.aggregate<BookingFacetResult>([
      { $match: { owner } },
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          upcoming: [
            { $match: { status: 'confirmed', checkIn: { $gte: today } } },
            { $count: 'count' },
          ],
          revenue: [
            { $match: { status: { $in: ['confirmed', 'completed'] } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } },
          ],
          occupiedNow: [
            {
              $match: {
                status: { $in: ACTIVE_BOOKING_STATUSES },
                checkIn: { $lte: today },
                checkOut: { $gt: today },
              },
            },
            { $group: { _id: '$property' } },
            { $count: 'count' },
          ],
        },
      },
    ]),
  ]);

  let totalProperties = 0;
  let activeProperties = 0;
  let inactiveProperties = 0;
  for (const row of propertyRows) {
    totalProperties += row.count;
    if (row._id === false) inactiveProperties += row.count;
    else activeProperties += row.count;
  }

  const f = facets[0] ?? EMPTY_FACET;

  const bookingsByStatus: BookingsByStatus = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  let totalBookings = 0;
  for (const row of f.byStatus) {
    bookingsByStatus[row._id] = row.count;
    totalBookings += row.count;
  }

  return {
    totalProperties,
    activeProperties,
    inactiveProperties,
    totalBookings,
    bookingsByStatus,
    upcomingBookings: f.upcoming[0]?.count ?? 0,
    occupiedNow: f.occupiedNow[0]?.count ?? 0,
    totalRevenue: f.revenue[0]?.total ?? 0,
  };
}

// Cached owner dashboard metrics
export async function getOwnerDashboard(ownerId: string): Promise<OwnerDashboardMetrics> {
  return cacheAside<OwnerDashboardMetrics>(cacheKeys.ownerDashboard(ownerId), TTL.dashboard, () =>
    computeOwnerDashboard(ownerId),
  );
}

// List owner properties with live occupancy status
export async function listOwnerProperties(
  ownerId: string,
  page: number,
  limit: number,
): Promise<{ items: OwnerPropertyItem[]; total: number }> {
  const owner = new Types.ObjectId(ownerId);

  const [docs, total] = await Promise.all([
    Property.find({ owner })
      .sort({ createdAt: -1 })
      .skip(getSkip(page, limit))
      .limit(limit)
      .lean<PropertyAttrs[]>(),
    Property.countDocuments({ owner }),
  ]);

  const occupancy = await getOccupancyMap(docs.map((d) => d._id));
  const items: OwnerPropertyItem[] = docs.map((d) => ({ ...d, occupancy: occupancy[String(d._id)] }));

  return { items, total };
}

export interface ListOwnerBookingsOptions {
  status?: BookingStatus;
  page: number;
  limit: number;
}

// List bookings for all properties belonging to this owner
export async function listOwnerBookings(
  ownerId: string,
  opts: ListOwnerBookingsOptions,
): Promise<{ items: unknown[]; total: number }> {
  const filter: Record<string, unknown> = { owner: new Types.ObjectId(ownerId) };
  if (opts.status) filter.status = opts.status;

  const [items, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(getSkip(opts.page, opts.limit))
      .limit(opts.limit)
      .populate('customer', 'name email')
      .populate('property', 'title location.city')
      .lean(),
    Booking.countDocuments(filter),
  ]);

  return { items, total };
}

// List bookings for a single owned property
export async function listPropertyBookings(
  propertyId: string,
  actorId: string,
  actorRole: string,
  page: number,
  limit: number,
): Promise<{ items: unknown[]; total: number }> {
  const property = await Property.findById(propertyId)
    .select('owner')
    .lean<{ _id: Types.ObjectId; owner: Types.ObjectId } | null>();
  if (!property) throw AppError.notFound('Property not found.');

  if (String(property.owner) !== actorId && actorRole !== 'admin') {
    throw AppError.forbidden('You do not have access to this property.');
  }

  const filter = { property: property._id };
  const [items, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(getSkip(page, limit))
      .limit(limit)
      .populate('customer', 'name')
      .lean(),
    Booking.countDocuments(filter),
  ]);

  return { items, total };
}
