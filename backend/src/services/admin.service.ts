import { Types, type HydratedDocument } from 'mongoose';
import { User, type UserRole, type UserDocument } from '../models/User';
import { Property, type PropertyAttrs, type PropertyType } from '../models/Property';
import { Booking, ACTIVE_BOOKING_STATUSES, type BookingStatus } from '../models/Booking';
import { AppError } from '../utils/errors';
import { getSkip } from '../utils/pagination';
import { startOfTodayUtc } from '../utils/dates';
import { cacheAside } from '../cache/cache';
import { cacheKeys, TTL } from '../cache/keys';
import { invalidateProperty, invalidateAdminDashboard } from '../cache/invalidation';
import { invalidateAuthUser } from '../cache/userCache';

export interface AdminUserMetrics {
  total: number;
  customers: number;
  owners: number;
  admins: number;
  active: number;
  inactive: number;
}

export interface AdminPropertyMetrics {
  total: number;
  active: number;
  inactive: number;
  occupiedNow: number;
  availableNow: number;
}

export interface AdminBookingMetrics {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export interface AdminTopCity {
  city: string;
  count: number;
}

export interface AdminDashboardMetrics {
  users: AdminUserMetrics;
  properties: AdminPropertyMetrics;
  bookings: AdminBookingMetrics;
  revenue: number;
  topCities: AdminTopCity[];
}

interface UserCountsRow {
  _id: null;
  total: number;
  customers: number;
  owners: number;
  admins: number;
  inactive: number;
}

interface PropertyCountsRow {
  total: number;
  inactive: number;
}

interface PropertyFacetResult {
  counts: PropertyCountsRow[];
  topCities: { _id: string | null; count: number }[];
}

interface BookingFacetResult {
  byStatus: { _id: BookingStatus; count: number }[];
  revenue: { total: number }[];
  occupiedNow: { count: number }[];
}

const EMPTY_BOOKING_FACET: BookingFacetResult = { byStatus: [], revenue: [], occupiedNow: [] };

// Parallel aggregation across users, properties, and bookings
async function computeAdminDashboard(): Promise<AdminDashboardMetrics> {
  const today = startOfTodayUtc();
  const propertiesCollection = Property.collection.name;

  const [userRows, propertyFacets, bookingFacets] = await Promise.all([
    User.aggregate<UserCountsRow>([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          customers: { $sum: { $cond: [{ $eq: ['$role', 'customer'] }, 1, 0] } },
          owners: { $sum: { $cond: [{ $eq: ['$role', 'owner'] }, 1, 0] } },
          admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } },
        },
      },
    ]),
    Property.aggregate<PropertyFacetResult>([
      {
        $facet: {
          counts: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                inactive: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } },
              },
            },
          ],
          topCities: [
            { $group: { _id: '$location.city', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 5 },
          ],
        },
      },
    ]),
    Booking.aggregate<BookingFacetResult>([
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
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
            {
              $lookup: {
                from: propertiesCollection,
                localField: '_id',
                foreignField: '_id',
                as: 'prop',
              },
            },
            { $match: { 'prop.isActive': true } },
            { $count: 'count' },
          ],
        },
      },
    ]),
  ]);

  const u = userRows[0];
  const users: AdminUserMetrics = {
    total: u?.total ?? 0,
    customers: u?.customers ?? 0,
    owners: u?.owners ?? 0,
    admins: u?.admins ?? 0,
    active: (u?.total ?? 0) - (u?.inactive ?? 0),
    inactive: u?.inactive ?? 0,
  };

  const pf = propertyFacets[0] ?? { counts: [], topCities: [] };
  const pc = pf.counts[0] ?? { total: 0, inactive: 0 };
  const activeProperties = pc.total - pc.inactive;

  const bf = bookingFacets[0] ?? EMPTY_BOOKING_FACET;
  const occupiedNow = bf.occupiedNow[0]?.count ?? 0;

  const properties: AdminPropertyMetrics = {
    total: pc.total,
    active: activeProperties,
    inactive: pc.inactive,
    occupiedNow,
    availableNow: Math.max(0, activeProperties - occupiedNow),
  };

  const bookings: AdminBookingMetrics = {
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const row of bf.byStatus) {
    bookings[row._id] = row.count;
    bookings.total += row.count;
  }

  const topCities: AdminTopCity[] = pf.topCities
    .filter((c): c is { _id: string; count: number } => c._id != null)
    .map((c) => ({ city: c._id, count: c.count }));

  return {
    users,
    properties,
    bookings,
    revenue: bf.revenue[0]?.total ?? 0,
    topCities,
  };
}

export async function getAdminDashboard(): Promise<AdminDashboardMetrics> {
  return cacheAside<AdminDashboardMetrics>(cacheKeys.adminDashboard(), TTL.dashboard, () =>
    computeAdminDashboard(),
  );
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface ListUsersFilters {
  page: number;
  limit: number;
  role?: UserRole;
  isActive?: boolean;
  q?: string;
}

export async function listUsers(
  filters: ListUsersFilters,
): Promise<{ items: unknown[]; total: number }> {
  const query: Record<string, unknown> = {};
  if (filters.role) query.role = filters.role;
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  if (filters.q) {
    const rx = new RegExp(escapeRegex(filters.q), 'i');
    query.$or = [{ name: rx }, { email: rx }];
  }

  const [items, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(getSkip(filters.page, filters.limit))
      .limit(filters.limit)
      .lean(),
    User.countDocuments(query),
  ]);

  return { items, total };
}

// Self-guard prevents an admin from deactivating or changing their own role
export async function updateUser(
  actorId: string,
  targetId: string,
  changes: { isActive?: boolean; role?: UserRole },
): Promise<UserDocument> {
  const user = await User.findById(targetId);
  if (!user) throw AppError.notFound('User not found.');

  if (targetId === actorId) {
    if (changes.isActive === false) {
      throw AppError.badRequest('You cannot deactivate your own account.');
    }
    if (changes.role !== undefined && changes.role !== user.role) {
      throw AppError.badRequest('You cannot change your own role.');
    }
  }

  const roleChanged = changes.role !== undefined && changes.role !== user.role;
  const shouldBumpToken = roleChanged || changes.isActive === false;

  const set: Record<string, unknown> = {};
  if (changes.isActive !== undefined) set.isActive = changes.isActive;
  if (changes.role !== undefined) set.role = changes.role;

  const update: Record<string, unknown> = { $set: set };
  if (shouldBumpToken) update.$inc = { tokenVersion: 1 };

  const updated = await User.findByIdAndUpdate(targetId, update, { new: true });
  if (!updated) throw AppError.notFound('User not found.');

  await invalidateAuthUser(targetId);

  if (roleChanged || changes.isActive !== undefined) {
    await invalidateAdminDashboard();
  }

  return updated;
}

export interface ListPropertiesFilters {
  page: number;
  limit: number;
  q?: string;
  city?: string;
  propertyType?: PropertyType;
  isActive?: boolean;
  ownerId?: string;
}

export async function listAllProperties(
  filters: ListPropertiesFilters,
): Promise<{ items: unknown[]; total: number }> {
  const query: Record<string, unknown> = {};
  if (filters.q) {
    const rx = new RegExp(escapeRegex(filters.q), 'i');
    query.$or = [{ title: rx }, { 'location.city': rx }];
  }
  if (filters.city) {
    query['location.city'] = new RegExp(`^${escapeRegex(filters.city)}$`, 'i');
  }
  if (filters.propertyType) query.propertyType = filters.propertyType;
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  if (filters.ownerId) query.owner = new Types.ObjectId(filters.ownerId);

  const [items, total] = await Promise.all([
    Property.find(query)
      .sort({ createdAt: -1 })
      .skip(getSkip(filters.page, filters.limit))
      .limit(filters.limit)
      .populate('owner', 'name email')
      .lean(),
    Property.countDocuments(query),
  ]);

  return { items, total };
}

export async function updateProperty(
  propertyId: string,
  changes: { isActive?: boolean },
): Promise<HydratedDocument<PropertyAttrs>> {
  const property = await Property.findById(propertyId);
  if (!property) throw AppError.notFound('Property not found.');

  if (changes.isActive !== undefined) property.isActive = changes.isActive;
  await property.save();

  await invalidateProperty(String(property._id), String(property.owner));

  return property;
}

export interface ListBookingsFilters {
  page: number;
  limit: number;
  status?: BookingStatus;
  from?: Date;
  to?: Date;
}

export async function listAllBookings(
  filters: ListBookingsFilters,
): Promise<{ items: unknown[]; total: number }> {
  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;
  if (filters.from || filters.to) {
    const range: Record<string, Date> = {};
    if (filters.from) range.$gte = filters.from;
    if (filters.to) range.$lte = filters.to;
    query.checkIn = range;
  }

  const [items, total] = await Promise.all([
    Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(getSkip(filters.page, filters.limit))
      .limit(filters.limit)
      .populate('customer', 'name email')
      .populate('property', 'title location.city')
      .populate('owner', 'name email')
      .lean(),
    Booking.countDocuments(query),
  ]);

  return { items, total };
}
