import mongoose, { Schema, Types, type InferSchemaType, type Model } from 'mongoose';

export const PropertyTypes = [
  'apartment',
  'house',
  'villa',
  'condo',
  'cabin',
  'studio',
  'room',
  'cottage',
  'loft',
  'other',
] as const;
export type PropertyType = (typeof PropertyTypes)[number];

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String }, // Cloudinary public id (present only for uploaded images)
  },
  { _id: false },
);

const propertySchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, maxlength: 5000 },
    location: {
      address: { type: String, trim: true },
      area: { type: String, trim: true, index: true },
      city: { type: String, required: true, trim: true },
      country: { type: String, trim: true, default: '' },
        coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
      geo: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
      },
    },
    pricePerNight: { type: Number, required: true, min: 0 },
    propertyType: { type: String, enum: PropertyTypes, required: true },
    maxGuests: { type: Number, required: true, min: 1 },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    amenities: { type: [String], default: [] },
    images: { type: [imageSchema], default: [] },
    isActive: { type: Boolean, default: true },

    // Denormalized rating statistics, maintained from the Review collection.
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },

    // Concurrency guard: bumped inside the booking transaction so two concurrent
    // bookings for the same property force a write conflict (see booking.service).
    bookingSeq: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
  },
);

// ── Indexes tuned to the actual query patterns ──────────────────────────────
// Full-text search across the human-facing fields.
propertySchema.index(
  { title: 'text', description: 'text', 'location.area': 'text', 'location.city': 'text' },
  { weights: { title: 5, 'location.city': 3, 'location.area': 2, description: 1 }, name: 'property_text' },
);
// Primary listing filter path (active properties in a city), plus default sort key.
propertySchema.index({ isActive: 1, 'location.city': 1, createdAt: -1 });
// Range filter on price and equality filter on type.
propertySchema.index({ pricePerNight: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ 'location.geo': '2dsphere' }, { sparse: true });

export type PropertyAttrs = InferSchemaType<typeof propertySchema> & { _id: Types.ObjectId };
export const Property: Model<PropertyAttrs> =
  (mongoose.models.Property as Model<PropertyAttrs>) || mongoose.model<PropertyAttrs>('Property', propertySchema);
