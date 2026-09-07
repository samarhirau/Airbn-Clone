import mongoose, { Schema, Types, type InferSchemaType, type Model } from 'mongoose';

const wishlistSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
  },
);

wishlistSchema.index({ customer: 1, property: 1 }, { unique: true });

export type WishlistAttrs = InferSchemaType<typeof wishlistSchema> & { _id: Types.ObjectId };
export const Wishlist: Model<WishlistAttrs> =
  (mongoose.models.Wishlist as Model<WishlistAttrs>) || mongoose.model<WishlistAttrs>('Wishlist', wishlistSchema);
