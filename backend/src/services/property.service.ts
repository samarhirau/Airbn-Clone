import { Types } from 'mongoose';
import { Property } from '../models/Property';
import { Booking, ACTIVE_BOOKING_STATUSES } from '../models/Booking';
import type { PropertyType } from '../models/Property';
import type { UserRole } from '../models/User';
import { AppError, ErrorCodes } from '../utils/errors';
import { getSkip, resolveSort } from '../utils/pagination';
import { cacheAside, cacheGetNumber } from '../cache/cache';
import { cacheKeys, hashQuery, TTL } from '../cache/keys';
import { invalidateProperty } from '../cache/invalidation';
import type { CreatePropertyInput, UpdatePropertyInput } from '../validators/property.validator';
import { toUtcMidnight } from '../utils/dates';
import {
  getPropertyAvailability,
  getMonthCalendar,
  type OccupancyInfo,
  type MonthCalendarResult,
} from './availability.service';
export interface PublicProperty {
  id: string;
  owner: string;
  title: string;
  description: string;
  location: {
    address?: string;
    area?: string;
    city: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
  };
  pricePerNight: number;
  propertyType: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: { url: string; publicId?: string }[];
  isActive: boolean;
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PropertyLean {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  title: string;
  description: string;
  location: {
    address?: string;
    area?: string;
    city: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
    geo?: { type: string; coordinates: [number, number] };
  };
  pricePerNight: number;
  propertyType: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: { url: string; publicId?: string }[];
  isActive: boolean;
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyListFilters {
  q?: string;
  city?: string;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  bedrooms?: number;
  checkIn?: Date;
  checkOut?: Date;
  amenities?: string[];
  sort?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  bounds?: string;
  page: number;
  limit: number;
}

export interface PropertyListResult {
  items: PublicProperty[];
  total: number;
}

export interface Actor {
  id: string;
  role: UserRole;
}

const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  price_asc: { pricePerNight: 1 },
  price_desc: { pricePerNight: -1 },
  rating: { ratingAvg: -1, ratingCount: -1 },
};

const UPDATABLE_FIELDS = [
  'title',
  'description',
  'location',
  'pricePerNight',
  'propertyType',
  'maxGuests',
  'bedrooms',
  'bathrooms',
  'amenities',
  'images',
  'isActive',
] as const;

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  lisbon: { lat: 38.7223, lng: -9.1393 },
  madrid: { lat: 40.4168, lng: -3.7038 },
  barcelona: { lat: 41.3879, lng: 2.1699 },
  guarda: { lat: 40.5373, lng: -7.2658 },
  goa: { lat: 15.2993, lng: 74.124 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  delhi: { lat: 28.6139, lng: 77.209 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  manali: { lat: 32.2432, lng: 77.1892 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  shimla: { lat: 31.1048, lng: 77.1734 },
  rishikesh: { lat: 30.0869, lng: 78.2676 },
  udaipur: { lat: 24.5854, lng: 73.7125 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  pune: { lat: 18.5204, lng: 73.8567 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  kerala: { lat: 9.9312, lng: 76.2673 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  agra: { lat: 27.1767, lng: 78.0081 },
  varanasi: { lat: 25.3176, lng: 82.9739 },
  darjeeling: { lat: 27.041, lng: 88.2663 },
  ooty: { lat: 11.4102, lng: 76.695 },
  munnar: { lat: 10.0889, lng: 77.0595 },
  paris: { lat: 48.8566, lng: 2.3522 },
  london: { lat: 51.5074, lng: -0.1278 },
  newyork: { lat: 40.7128, lng: -74.006 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
};

/** Resolve coordinates with city fallback and synchronize GeoJSON Point for MongoDB 2dsphere. */
export function resolveCoordinates(loc: {
  city: string;
  coordinates?: { lat: number; lng: number };
}): {
  coordinates: { lat: number; lng: number };
  geo: { type: 'Point'; coordinates: [number, number] };
} {
  let coords = loc.coordinates;
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    const key = loc.city.toLowerCase().trim();
    coords = CITY_COORDINATES[key] ?? { lat: 20.5937, lng: 78.9629 };
  }
  return {
    coordinates: coords,
    geo: {
      type: 'Point',
      coordinates: [coords.lng, coords.lat], // [longitude, latitude] GeoJSON
    },
  };
}

function toPublicProperty(d: PropertyLean): PublicProperty {
    const coords =
    d.location.coordinates ??
    (d.location.geo?.coordinates
      ? { lat: d.location.geo.coordinates[1], lng: d.location.geo.coordinates[0] }
      : undefined);
  return {
    id: String(d._id),
    owner: String(d.owner),
    title: d.title,
    description: d.description,
    location: {
      address: d.location.address,
      area: d.location.area,
      city: d.location.city,
      country: d.location.country,
      coordinates: coords,
    },
    pricePerNight: d.pricePerNight,
    propertyType: d.propertyType,
    maxGuests: d.maxGuests,
    bedrooms: d.bedrooms,
    bathrooms: d.bathrooms,
    amenities: d.amenities,
    images: d.images,
    isActive: d.isActive,
    ratingAvg: d.ratingAvg,
    ratingCount: d.ratingCount,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

async function buildListQuery(f: PropertyListFilters): Promise<Record<string, unknown>> {
  const query: Record<string, unknown> = { isActive: true };
  if (f.q) query.$text = { $search: f.q };
  if (f.city) query['location.city'] = { $regex: escapeRegex(f.city), $options: 'i' };
  if (f.propertyType) query.propertyType = f.propertyType;
  if (f.guests !== undefined) query.maxGuests = { $gte: f.guests };
  if (f.bedrooms !== undefined) query.bedrooms = { $gte: f.bedrooms };
  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    const price: Record<string, number> = {};
    if (f.minPrice !== undefined) price.$gte = f.minPrice;
    if (f.maxPrice !== undefined) price.$lte = f.maxPrice;
    query.pricePerNight = price;
  }
  if (f.amenities && f.amenities.length > 0) query.amenities = { $all: f.amenities };

  
  // Availability dates filter: exclude properties that have overlapping active bookings
  if (f.checkIn && f.checkOut) {
    const checkIn = toUtcMidnight(f.checkIn)!;
    const checkOut = toUtcMidnight(f.checkOut)!;
    const busyIds = await Booking.distinct('property', {
      status: { $in: ACTIVE_BOOKING_STATUSES },
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn },
    });
    if (busyIds.length > 0) {
      query._id = { $nin: busyIds };
    }
  }
   // Geospatial proximity query ($nearSphere)
  if (f.lat !== undefined && f.lng !== undefined) {
    const maxMeters = (f.radiusKm || 50) * 1000;
    query['location.geo'] = {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [f.lng, f.lat],
        },
        $maxDistance: maxMeters,
      },
    };
  } else if (f.bounds) {
    // Map bounding box ($geoWithin $box): "south,west,north,east"
    const [south, west, north, east] = f.bounds.split(',').map(Number);
    query['location.geo'] = {
      $geoWithin: {
        $box: [
          [west, south], // bottom-left [lng, lat]
          [east, north], // top-right [lng, lat]
        ],
      },
    };
  }

  return query;
}

export async function listProperties(filters: PropertyListFilters): Promise<PropertyListResult> {
  const version = await cacheGetNumber(cacheKeys.propertyListVersion());
  const hash = hashQuery({
    q: filters.q,
    city: filters.city,
    propertyType: filters.propertyType,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    guests: filters.guests,
    bedrooms: filters.bedrooms,
    checkIn: filters.checkIn?.toISOString(),
    checkOut: filters.checkOut?.toISOString(),
    amenities: filters.amenities,
    sort: filters.sort ?? 'newest',
    lat: filters.lat,
    lng: filters.lng,
    radiusKm: filters.radiusKm,
    bounds: filters.bounds,
    page: filters.page,
    limit: filters.limit,
  });
  const key = cacheKeys.propertyList(version, hash);

  return cacheAside<PropertyListResult>(key, TTL.propertyList, async () => {
    const query = await buildListQuery(filters);
    const isGeoNear = filters.lat !== undefined && filters.lng !== undefined;
    const sort = isGeoNear && !filters.sort ? undefined : resolveSort(filters.sort, SORT_MAP, 'newest');

    const cursor = Property.find(query);
    if (sort) cursor.sort(sort);

    const [docs, total] = await Promise.all([
      cursor
        .skip(getSkip(filters.page, filters.limit))
        .limit(filters.limit)
        .lean<PropertyLean[]>(),
      Property.countDocuments(query),
    ]);
    return { items: docs.map(toPublicProperty), total };
  });
}

export async function getPropertyById(id: string, viewer?: Actor): Promise<PublicProperty> {
  const property = await cacheAside<PublicProperty | null>(
    cacheKeys.propertyDetail(id),
    TTL.propertyDetail,
    async () => {
      const doc = await Property.findById(id).lean<PropertyLean | null>();
      return doc ? toPublicProperty(doc) : null;
    },
  );
  if (!property) throw AppError.notFound('Property not found.');

  if (!property.isActive) {
    const privileged = Boolean(viewer && (viewer.role === 'admin' || property.owner === viewer.id));
    if (!privileged) throw AppError.notFound('Property not found.');
  }
  return property;
}

export async function createProperty(ownerId: string, input: CreatePropertyInput): Promise<PublicProperty> {
  const resolved = resolveCoordinates(input.location);
  const created = await Property.create({
    owner: new Types.ObjectId(ownerId),
    title: input.title,
    description: input.description,
    location: {
      ...input.location,
      coordinates: resolved.coordinates,
      geo: resolved.geo,
    },
    pricePerNight: input.pricePerNight,
    propertyType: input.propertyType,
    maxGuests: input.maxGuests,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    amenities: input.amenities,
    images: input.images,
  });
  await invalidateProperty(String(created._id), ownerId);
  return toPublicProperty(created.toObject() as unknown as PropertyLean);
}

export async function updateProperty(
  id: string,
  actor: Actor,
  input: UpdatePropertyInput,
): Promise<PublicProperty> {
  const existing = await Property.findById(id)
    .select('owner')
    .lean<{ _id: Types.ObjectId; owner: Types.ObjectId } | null>();
  if (!existing) throw AppError.notFound('Property not found.');
  if (actor.role !== 'admin' && String(existing.owner) !== actor.id) {
    throw AppError.forbidden('You can only modify your own properties.');
  }

  const $set: Record<string, unknown> = {};
  for (const field of UPDATABLE_FIELDS) {
    const value = input[field];
    if (value !== undefined) {
      if (field === 'location' && input.location) {
        const resolved = resolveCoordinates(input.location);
        $set['location'] = {
          ...input.location,
          coordinates: resolved.coordinates,
          geo: resolved.geo,
        };
      } else {
        $set[field] = value;
      }
    }
  }

  const updated = await Property.findByIdAndUpdate(id, { $set }, { new: true, runValidators: true }).lean<
    PropertyLean | null
  >();
  if (!updated) throw AppError.notFound('Property not found.');

  await invalidateProperty(id, String(existing.owner));
  return toPublicProperty(updated);
}

export async function deleteProperty(id: string, actor: Actor): Promise<void> {
  const existing = await Property.findById(id)
    .select('owner')
    .lean<{ _id: Types.ObjectId; owner: Types.ObjectId } | null>();
  if (!existing) throw AppError.notFound('Property not found.');
  if (actor.role !== 'admin' && String(existing.owner) !== actor.id) {
    throw AppError.forbidden('You can only delete your own properties.');
  }

  // Active bookings block hard-deletion (preserves customer history)
  const blockingBooking = await Booking.exists({
    property: id,
    status: { $in: ['pending', 'confirmed', 'completed'] },
  });
  if (blockingBooking) {
    throw AppError.conflict(
      'This property has bookings and cannot be deleted. Deactivate it instead (set isActive:false).',
      ErrorCodes.CONFLICT,
    );
  }

  await Property.deleteOne({ _id: id });
  await invalidateProperty(id, String(existing.owner));
}



//  Live availability for a property (GET /:id/availability). Never cached.
 
export async function getAvailabilityFor(
  id: string,
  range?: { checkIn: Date; checkOut: Date },
): Promise<OccupancyInfo & { requestedRangeAvailable?: boolean }> {
  const exists = await Property.exists({ _id: id, isActive: true });
  if (!exists) throw AppError.notFound('Property not found.');
  let normalizedRange: { checkIn: Date; checkOut: Date } | undefined;
  if (range) {
    const checkIn = toUtcMidnight(range.checkIn);
    const checkOut = toUtcMidnight(range.checkOut);
    if (!checkIn || !checkOut || checkOut.getTime() <= checkIn.getTime()) {
      throw AppError.badRequest('checkOut must be after checkIn.', ErrorCodes.VALIDATION_ERROR);
    }
    normalizedRange = { checkIn, checkOut };
  }
  return getPropertyAvailability(id, normalizedRange);
}


export async function getCalendarFor(
  id: string,
  year: number,
  month: number,
): Promise<MonthCalendarResult> {
  const exists = await Property.exists({ _id: id, isActive: true });
  if (!exists) throw AppError.notFound('Property not found.');
  return getMonthCalendar(id, year, month);
}
