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


export const listPropertiesQuery = paginationQuery
  .extend({
    q: z.string().trim().min(1).max(160).optional(),
    city: z.string().trim().min(1).max(120).optional(),
    propertyType: z.enum(PropertyTypes).optional(),
    minPrice: z.coerce.number().min(0).max(1_000_000).optional(),
    maxPrice: z.coerce.number().min(0).max(1_000_000).optional(),
    guests: z.coerce.number().int().min(1).max(100).optional(),
    bedrooms: z.coerce.number().int().min(0).max(100).optional(),
    checkIn: z.coerce.date().optional(),
    checkOut: z.coerce.date().optional(),
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
    })
  .refine((data) => (data.checkIn === undefined) === (data.checkOut === undefined), {
    message: 'Provide both checkIn and checkOut, or neither.',
    path: ['checkIn'],
  })
  .refine((data) => !(data.checkIn && data.checkOut) || data.checkIn < data.checkOut, {
    message: 'checkOut must be after checkIn.',
    path: ['checkOut'],
  });
export type ListPropertiesInput = z.infer<typeof listPropertiesQuery>;


export const availabilityQuery = z
  .object({
    checkIn: z.coerce.date().optional(),
    checkOut: z.coerce.date().optional(),
  })
  .refine((data) => (data.checkIn === undefined) === (data.checkOut === undefined), {
    message: 'Provide both checkIn and checkOut, or neither.',
  })
  .refine((data) => !(data.checkIn && data.checkOut) || data.checkIn < data.checkOut, {
    message: 'checkOut must be after checkIn.',
    path: ['checkOut'],
  });
export type AvailabilityQueryInput = z.infer<typeof availabilityQuery>;


// Query for GET /api/properties/:id/calendar
export const calendarQuery = z.object({
  year: z.coerce.number().int().min(2020).max(2100).default(() => new Date().getFullYear()),
  month: z.coerce.number().int().min(1).max(12).default(() => new Date().getMonth() + 1),
});
export type CalendarQueryInput = z.infer<typeof calendarQuery>;
