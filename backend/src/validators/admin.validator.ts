import { z } from 'zod';
import { paginationQuery, objectId } from './common';
import { UserRoles } from '../models/User';
import { PropertyTypes } from '../models/Property';
import { BookingStatuses } from '../models/Booking';

const booleanQueryParam = z.enum(['true', 'false']).transform((value) => value === 'true');

// User query filters
export const listUsersQuery = paginationQuery.extend({
  role: z.enum(UserRoles).optional(),
  isActive: booleanQueryParam.optional(),
  q: z.string().trim().min(1).max(120).optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuery>;

// User moderation update
export const updateUserBody = z
  .object({
    isActive: z.boolean().optional(),
    role: z.enum(UserRoles).optional(),
  })
  .refine((data) => data.isActive !== undefined || data.role !== undefined, {
    message: 'Provide at least one field to update: isActive or role.',
  });
export type UpdateUserBody = z.infer<typeof updateUserBody>;

// Property query filters
export const listPropertiesQuery = paginationQuery.extend({
  q: z.string().trim().min(1).max(160).optional(),
  city: z.string().trim().min(1).max(120).optional(),
  propertyType: z.enum(PropertyTypes).optional(),
  isActive: booleanQueryParam.optional(),
  ownerId: objectId.optional(),
});
export type ListPropertiesQuery = z.infer<typeof listPropertiesQuery>;

// Property moderation toggle
export const updatePropertyBody = z
  .object({
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.isActive !== undefined, {
    message: 'Provide at least one field to update: isActive.',
  });
export type UpdatePropertyBody = z.infer<typeof updatePropertyBody>;

// Global bookings query
export const listBookingsQuery = paginationQuery
  .extend({
    status: z.enum(BookingStatuses).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine((data) => !(data.from && data.to) || data.from <= data.to, {
    message: 'from must be on or before to.',
    path: ['from'],
  });
export type ListBookingsQuery = z.infer<typeof listBookingsQuery>;
