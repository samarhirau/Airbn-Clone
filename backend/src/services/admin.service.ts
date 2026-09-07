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
import { getOccupancyMap, type OccupancyInfo } from './availability.service';

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
  minPrice?: number;
  maxPrice?: number;
  availability?: 'available' | 'occupied';
}

export interface AdminPropertyItem extends PropertyAttrs {
  occupancy?: OccupancyInfo;
}

export async function listAllProperties(
  filters: ListPropertiesFilters,
): Promise<{ items: AdminPropertyItem[]; total: number }> {
  const query: Record<string, unknown> = {};
  if (filters.q) {
    const rx = new RegExp(escapeRegex(filters.q), 'i');
    query.$or = [{ title: rx }, { 'location.city': rx }, { 'location.area': rx }];
  }
  if (filters.city) {
    query['location.city'] = new RegExp(`^${escapeRegex(filters.city)}$`, 'i');
  }
  if (filters.propertyType) query.propertyType = filters.propertyType;
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  if (filters.ownerId) query.owner = new Types.ObjectId(filters.ownerId);

   if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const price: Record<string, number> = {};
    if (filters.minPrice !== undefined) price.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) price.$lte = filters.maxPrice;
    query.pricePerNight = price;
  }

  if (filters.availability) {
    const today = startOfTodayUtc();
    const busyIds = await Booking.distinct('property', {
      status: { $in: ACTIVE_BOOKING_STATUSES },
      checkIn: { $lte: today },
      checkOut: { $gt: today },
    });
    if (filters.availability === 'occupied') {
      query._id = { $in: busyIds };
    } else {
      query._id = { $nin: busyIds };
    }
  }

  const [docs, total] = await Promise.all([
    Property.find(query)
      .sort({ createdAt: -1 })
      .skip(getSkip(filters.page, filters.limit))
      .limit(filters.limit)
      .populate('owner', 'name email')
      .lean<PropertyAttrs[]>(),
    Property.countDocuments(query),
  ]);

    const occupancy = await getOccupancyMap(docs.map((d) => d._id));
  const items: AdminPropertyItem[] = docs.map((d) => ({
    ...d,
    occupancy: occupancy[String(d._id)],
  }));
  
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



export interface MonthlyRevenueMetric {
  month: string;
  label: string;
  revenue: number;
  bookingsCount: number;
  completedBookings: number;
}

export interface MonthlyUserGrowth {
  month: string;
  label: string;
  customers: number;
  owners: number;
  total: number;
}

export interface AdminTopRevenueProperty {
  propertyId: string;
  title: string;
  city: string;
  ownerName: string;
  revenue: number;
  bookingsCount: number;
}

export interface AdminAnalyticsResult {
  periodMonths: number;
  startDate: string;
  totalPlatformRevenue: number;
  totalPlatformBookings: number;
  monthlyRevenue: MonthlyRevenueMetric[];
  monthlyUserGrowth: MonthlyUserGrowth[];
  bookingStatusDistribution: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  topRevenueProperties: AdminTopRevenueProperty[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function generateMonthSlots(months: number): { slots: { month: string; label: string }[]; startDate: Date } {
  const slots: { month: string; label: string }[] = [];
  const now = new Date();
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months + 1, 1));

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const year = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const month = `${year}-${m}`;
    const label = `${MONTH_NAMES[d.getUTCMonth()]} ${year}`;
    slots.push({ month, label });
  }

  return { slots, startDate };
}

interface AdminBookingMonthRow {
  _id: string;
  revenue: number;
  bookingsCount: number;
  completedBookings: number;
}

interface AdminStatusRow {
  _id: BookingStatus;
  count: number;
}

interface AdminTopPropRow {
  _id: Types.ObjectId;
  revenue: number;
  bookingsCount: number;
}

interface AdminBookingFacetResult {
  monthly: AdminBookingMonthRow[];
  byStatus: AdminStatusRow[];
  topProperties: AdminTopPropRow[];
}

interface UserGrowthRow {
  _id: string;
  customers: number;
  owners: number;
  total: number;
}

async function computeAdminAnalytics(months: number = 6): Promise<AdminAnalyticsResult> {
  const { slots, startDate } = generateMonthSlots(months);

  const [bookingFacets, userRows] = await Promise.all([
    Booking.aggregate<AdminBookingFacetResult>([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $facet: {
          monthly: [
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                revenue: {
                  $sum: { $cond: [{ $in: ['$status', ['confirmed', 'completed']] }, '$totalPrice', 0] },
                },
                bookingsCount: { $sum: 1 },
                completedBookings: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
          topProperties: [
            {
              $group: {
                _id: '$property',
                revenue: {
                  $sum: { $cond: [{ $in: ['$status', ['confirmed', 'completed']] }, '$totalPrice', 0] },
                },
                bookingsCount: { $sum: 1 },
              },
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ]),
    User.aggregate<UserGrowthRow>([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          customers: { $sum: { $cond: [{ $eq: ['$role', 'customer'] }, 1, 0] } },
          owners: { $sum: { $cond: [{ $eq: ['$role', 'owner'] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const f = bookingFacets[0] ?? { monthly: [], byStatus: [], topProperties: [] };

  const bookingMonthMap = new Map<string, AdminBookingMonthRow>();
  for (const r of f.monthly) {
    bookingMonthMap.set(r._id, r);
  }

  const userMonthMap = new Map<string, UserGrowthRow>();
  for (const r of userRows) {
    userMonthMap.set(r._id, r);
  }

  let totalPlatformRevenue = 0;
  let totalPlatformBookings = 0;

  const monthlyRevenue: MonthlyRevenueMetric[] = slots.map((slot) => {
    const data = bookingMonthMap.get(slot.month);
    const rev = data?.revenue ?? 0;
    const count = data?.bookingsCount ?? 0;
    totalPlatformRevenue += rev;
    totalPlatformBookings += count;
    return {
      month: slot.month,
      label: slot.label,
      revenue: rev,
      bookingsCount: count,
      completedBookings: data?.completedBookings ?? 0,
    };
  });

  const monthlyUserGrowth: MonthlyUserGrowth[] = slots.map((slot) => {
    const data = userMonthMap.get(slot.month);
    return {
      month: slot.month,
      label: slot.label,
      customers: data?.customers ?? 0,
      owners: data?.owners ?? 0,
      total: data?.total ?? 0,
    };
  });

  // Top earning properties with populated owner and location
  const topPropIds = f.topProperties.map((p) => p._id);
  const populatedProps = await Property.find({ _id: { $in: topPropIds } })
    .select('title location.city owner')
    .populate<{ owner: { name: string } | null }>('owner', 'name')
    .lean<{ _id: Types.ObjectId; title: string; location?: { city?: string }; owner?: { name?: string } | null }[]>();

  const propMap = new Map(populatedProps.map((p) => [String(p._id), p]));

  const topRevenueProperties: AdminTopRevenueProperty[] = f.topProperties.map((p) => {
    const info = propMap.get(String(p._id));
    return {
      propertyId: String(p._id),
      title: info?.title || 'Listing',
      city: info?.location?.city || 'Unknown',
      ownerName: info?.owner?.name || 'Owner',
      revenue: p.revenue,
      bookingsCount: p.bookingsCount,
    };
  });

  const bookingStatusDistribution = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  for (const s of f.byStatus) {
    if (s._id in bookingStatusDistribution) {
      bookingStatusDistribution[s._id] = s.count;
    }
  }

  return {
    periodMonths: months,
    startDate: startDate.toISOString(),
    totalPlatformRevenue,
    totalPlatformBookings,
    monthlyRevenue,
    monthlyUserGrowth,
    bookingStatusDistribution,
    topRevenueProperties,
  };
}

/** Admin platform-wide historical analytics with cache-aside acceleration. */
export async function getAdminAnalytics(months: number = 6): Promise<AdminAnalyticsResult> {
  return cacheAside<AdminAnalyticsResult>(
    cacheKeys.adminAnalytics(months),
    TTL.analytics,
    () => computeAdminAnalytics(months),
  );
}

