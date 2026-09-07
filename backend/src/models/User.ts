import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';

export const UserRoles = ['customer', 'owner', 'admin'] as const;
export type UserRole = (typeof UserRoles)[number];

export interface UserAttrs {
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  bio?: string;
  isActive: boolean;
  tokenVersion: number;
  googleId?: string;
  isGoogleAuth?: boolean;
}

const userSchema = new Schema<UserAttrs>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Never selected by default — callers must explicitly `.select('+passwordHash')`.
    passwordHash: { type: String, select: false },
    role: { type: String, enum: UserRoles, default: 'customer', required: true, index: true },
    phone: { type: String, trim: true },
    avatar: { type: String, trim: true },
    bio: { type: String, maxlength: 500 },
    isActive: { type: Boolean, default: true },
    // Bumped to invalidate all outstanding access tokens (e.g. on password change / force logout).
    tokenVersion: { type: Number, default: 0 },
    googleId: { type: String, sparse: true, index: true },
    isGoogleAuth: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        delete (ret as Record<string, unknown>).passwordHash;
        return ret;
      },
    },
  },
);

export type UserDocument = HydratedDocument<UserAttrs>;

// Guard against re-registration (Vitest module reloads, serverless hot-reload): reuse the
// already-compiled model if present, otherwise compile it once.
export const User: Model<UserAttrs> =
  (mongoose.models.User as Model<UserAttrs>) || mongoose.model<UserAttrs>('User', userSchema);
