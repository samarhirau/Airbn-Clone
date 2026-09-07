import mongoose, { Schema, Types, type InferSchemaType, type Model } from 'mongoose';

const refreshTokenSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jti: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByJti: { type: String, default: null },
    userAgent: { type: String },
    ip: { type: String },
  },
  { timestamps: true },
);

// TTL: remove documents once `expiresAt` has passed.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshTokenAttrs = InferSchemaType<typeof refreshTokenSchema> & { _id: Types.ObjectId };
export const RefreshToken: Model<RefreshTokenAttrs> =
  (mongoose.models.RefreshToken as Model<RefreshTokenAttrs>) ||
  mongoose.model<RefreshTokenAttrs>('RefreshToken', refreshTokenSchema);
