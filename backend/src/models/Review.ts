import mongoose, { Schema, Types, type InferSchemaType, type Model } from 'mongoose';

const reviewSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
  },
);

reviewSchema.index({ property: 1, createdAt: -1 });

export type ReviewAttrs = InferSchemaType<typeof reviewSchema> & { _id: Types.ObjectId };
export const Review: Model<ReviewAttrs> =
  (mongoose.models.Review as Model<ReviewAttrs>) || mongoose.model<ReviewAttrs>('Review', reviewSchema);
