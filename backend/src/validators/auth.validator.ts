import { z } from 'zod';

/**
 * Auth request schemas. Self-registration is limited to `customer`/`owner` — a client
 * can never register as `admin` (admins are seeded/promoted). Passwords are length-bounded
 * (bcrypt truncates beyond 72 bytes, and we require a reasonable minimum).
 */
export const registerBody = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  role: z.enum(['customer', 'owner']).optional(),
  phone: z.string().trim().max(30).optional(),
});

export const loginBody = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileBody = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    phone: z.string().trim().max(30).optional(),
    avatar: z.string().trim().url().optional(),
    bio: z.string().trim().max(500).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' });

export type RegisterInput = z.infer<typeof registerBody>;
export type LoginInput = z.infer<typeof loginBody>;
export type UpdateProfileInput = z.infer<typeof updateProfileBody>;
