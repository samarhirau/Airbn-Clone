import { z } from 'zod';
import { PropertyTypes } from '../models/Property';
import { paginationQuery } from './common';


/** One property image. `publicId` is set only for Cloudinary-uploaded images. */
const imageInput = z.object({
  url: z.string().url().max(2000),
  publicId: z.string().trim().max(200).optional(),
});

/** Location sub-document. `city` is the only required part (it drives search). */
const locationInput = z.object({
  address: z.string().trim().max(200).optional(),
  area: z.string().trim().max(120).optional(),
  city: z.string().trim().min(1).max(120),
  country: z.string().trim().max(120).optional(),
});

/**
 * Body for `POST /api/properties`. `pricePerNight` must be strictly positive: a
 * $0/night listing is not a real product and would make booking totals degenerate
 * (the model only enforces `>= 0`, so we tighten it at the API boundary).
 */
export const createPropertyBody = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(5000),
  location: locationInput,
  pricePerNight: z.coerce.number().positive().max(1_000_000),
  propertyType: z.enum(PropertyTypes),
  maxGuests: z.coerce.number().int().min(1).max(100),
  bedrooms: z.coerce.number().int().min(0).max(100),
  bathrooms: z.coerce.number().int().min(0).max(100),
  amenities: z.array(z.string().trim().min(1).max(50)).max(50).default([]),
  images: z.array(imageInput).max(30).default([]),
});
export type CreatePropertyInput = z.infer<typeof createPropertyBody>;

/**
 * Body for `PATCH /api/properties/:id`. Every field is optional (partial update) but
 * at least one must be present. `isActive` lets an owner deactivate a listing instead
 * of deleting it. `owner` is not updatable.
 */
export const updatePropertyBody = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().min(1).max(5000).optional(),
    location: locationInput.optional(),
    pricePerNight: z.coerce.number().positive().max(1_000_000).optional(),
    propertyType: z.enum(PropertyTypes).optional(),
    maxGuests: z.coerce.number().int().min(1).max(100).optional(),
    bedrooms: z.coerce.number().int().min(0).max(100).optional(),
    bathrooms: z.coerce.number().int().min(0).max(100).optional(),
    amenities: z.array(z.string().trim().min(1).max(50)).max(50).optional(),
    images: z.array(imageInput).max(30).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update.',
  });
export type UpdatePropertyInput = z.infer<typeof updatePropertyBody>;

/** Whitelisted public sort tokens (map to Mongo sort in the service). */
export const propertySortTokens = ['newest', 'price_asc', 'price_desc', 'rating'] as const;

/**
 * Query for `GET /api/properties` (public search). Composes shared pagination and adds
 * text search (`q`), city, type, price range, guest capacity and amenity filters plus a
 * whitelisted sort token. `amenities` accepts repeated params (`?amenities=wifi&amenities=pool`)
 * and/or comma-separated values; every value is trimmed and blanks dropped.
 */
export const listPropertiesQuery = paginationQuery
  .extend({
    q: z.string().trim().min(1).max(160).optional(),
    city: z.string().trim().min(1).max(120).optional(),
    propertyType: z.enum(PropertyTypes).optional(),
    minPrice: z.coerce.number().min(0).max(1_000_000).optional(),
    maxPrice: z.coerce.number().min(0).max(1_000_000).optional(),
    guests: z.coerce.number().int().min(1).max(100).optional(),
    amenities: z
      .union([z.string(), z.array(z.string())])
      .transform((v) =>
        (Array.isArray(v) ? v : [v]).flatMap((s) => s.split(',')).map((s) => s.trim()).filter(Boolean),
      )
      .pipe(z.array(z.string().min(1).max(50)).max(50))
      .optional(),
    sort: z.enum(propertySortTokens).optional(),
  })
  .refine((data) => !(data.minPrice !== undefined && data.maxPrice !== undefined) || data.minPrice <= data.maxPrice, {
    message: 'minPrice must be less than or equal to maxPrice.',
    path: ['minPrice'],
  });
export type ListPropertiesInput = z.infer<typeof listPropertiesQuery>;
