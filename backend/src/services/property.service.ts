import { Types } from 'mongoose';
import { Property } from '../models/Property';
import { Booking } from '../models/Booking';
import type { PropertyType } from '../models/Property';
import type { UserRole } from '../models/User';
import { AppError, ErrorCodes } from '../utils/errors';
import { getSkip, resolveSort } from '../utils/pagination';
import { cacheAside, cacheGetNumber } from '../cache/cache';
import { cacheKeys, hashQuery, TTL } from '../cache/keys';
import { invalidateProperty } from '../cache/invalidation';
import type { CreatePropertyInput, UpdatePropertyInput } from '../validators/property.validator';

export interface PublicProperty {
  id: string;
  owner: string;
  title: string;
  description: string;
  location: { address?: string; area?: string; city: string; country?: string };
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
  location: { address?: string; area?: string; city: string; country?: string };
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
  amenities?: string[];
  sort?: string;
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

function toPublicProperty(d: PropertyLean): PublicProperty {
  return {
    id: String(d._id),
    owner: String(d.owner),
    title: d.title,
    description: d.description,
    location: d.location,
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

function buildListQuery(f: PropertyListFilters): Record<string, unknown> {
  const query: Record<string, unknown> = { isActive: true };
  if (f.q) query.$text = { $search: f.q };
  if (f.city) query['location.city'] = { $regex: escapeRegex(f.city), $options: 'i' };
  if (f.propertyType) query.propertyType = f.propertyType;
  if (f.guests !== undefined) query.maxGuests = { $gte: f.guests };
  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    const price: Record<string, number> = {};
    if (f.minPrice !== undefined) price.$gte = f.minPrice;
    if (f.maxPrice !== undefined) price.$lte = f.maxPrice;
    query.pricePerNight = price;
  }
  if (f.amenities && f.amenities.length > 0) query.amenities = { $all: f.amenities };
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
    amenities: filters.amenities,
    sort: filters.sort ?? 'newest',
    page: filters.page,
    limit: filters.limit,
  });
  const key = cacheKeys.propertyList(version, hash);

  return cacheAside<PropertyListResult>(key, TTL.propertyList, async () => {
    const query = buildListQuery(filters);
    const sort = resolveSort(filters.sort, SORT_MAP, 'newest');
    const [docs, total] = await Promise.all([
      Property.find(query)
        .sort(sort)
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
  const created = await Property.create({
    owner: new Types.ObjectId(ownerId),
    title: input.title,
    description: input.description,
    location: input.location,
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
    if (value !== undefined) $set[field] = value;
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
