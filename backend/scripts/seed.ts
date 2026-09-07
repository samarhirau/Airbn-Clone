/* eslint-disable no-console */
import 'dotenv/config';
import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/db';
import { User } from '../src/models/User';
import { Property, type PropertyType } from '../src/models/Property';
import { Booking, type BookingStatus } from '../src/models/Booking';
import { Review } from '../src/models/Review';
import { Wishlist } from '../src/models/Wishlist';
import { hashPassword } from '../src/utils/password';
import { startOfTodayUtc, addDays, nightsBetween } from '../src/utils/dates';
import { markCompletedBookings } from '../src/jobs/markCompletedBookings';

const DEMO_PASSWORD = 'Password123!';
const today = startOfTodayUtc();

interface BookingSeed {
  customerKey: string;
  propertyIndex: number;
  offsetInDays: number;
  nights: number;
  guests: number;
  status: BookingStatus;
}

async function makeBooking(
  customerId: Types.ObjectId,
  ownerId: Types.ObjectId,
  propertyId: Types.ObjectId,
  pricePerNight: number,
  seed: BookingSeed,
) {
  const checkIn = addDays(today, seed.offsetInDays);
  const checkOut = addDays(checkIn, seed.nights);
  const numberOfNights = nightsBetween(checkIn, checkOut);
  return Booking.create({
    customer: customerId,
    property: propertyId,
    owner: ownerId,
    checkIn,
    checkOut,
    guests: seed.guests,
    numberOfNights,
    pricePerNight,
    totalPrice: pricePerNight * numberOfNights,
    status: seed.status,
    ...(seed.status === 'cancelled'
      ? { cancellation: { cancelledAt: new Date(), cancelledBy: customerId, reason: 'Change of plans' } }
      : {}),
  });
}

async function seed(): Promise<void> {
  if (process.env.NODE_ENV === 'production' && process.env.SEED_FORCE !== 'true') {
    throw new Error('Refusing to seed in production. Set SEED_FORCE=true to override.');
  }

  await connectDatabase();
  console.log('Clearing existing data…');
  await Promise.all([
    User.deleteMany({}),
    Property.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
    Wishlist.deleteMany({}),
  ]);

  // Seed Users
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const [, owner1, owner2, customer1, customer2, customer3] = await User.create([
    { name: 'Ada Admin', email: 'admin@stayhub.dev', passwordHash, role: 'admin' },
    { name: 'Olivia Owner', email: 'owner@stayhub.dev', passwordHash, role: 'owner', phone: '+1-202-555-0111' },
    { name: 'Owen Host', email: 'owner2@stayhub.dev', passwordHash, role: 'owner', phone: '+1-202-555-0122' },
    { name: 'Cara Customer', email: 'customer@stayhub.dev', passwordHash, role: 'customer' },
    { name: 'Carlos Traveler', email: 'customer2@stayhub.dev', passwordHash, role: 'customer' },
    { name: 'Chloe Guest', email: 'customer3@stayhub.dev', passwordHash, role: 'customer' },
  ]);
  console.log(`Created ${await User.countDocuments()} users.`);

  // Seed Properties
  interface PropSeed {
    owner: Types.ObjectId;
    title: string;
    description: string;
    area: string;
    city: string;
    country: string;
    pricePerNight: number;
    propertyType: PropertyType;
    maxGuests: number;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    isActive?: boolean;
  }

  const img = (id: number) => [
    { url: `https://picsum.photos/seed/stayhub-${id}-1/1200/800` },
    { url: `https://picsum.photos/seed/stayhub-${id}-2/1200/800` },
    { url: `https://picsum.photos/seed/stayhub-${id}-3/1200/800` },
  ];

  const propSeeds: PropSeed[] = [
    { owner: owner1._id, title: 'Sunlit Loft in the Old Town', description: 'Bright loft near city center.', area: 'Alfama', city: 'Lisbon', country: 'Portugal', pricePerNight: 120, propertyType: 'loft', maxGuests: 3, bedrooms: 1, bathrooms: 1, amenities: ['wifi', 'kitchen'] },
    { owner: owner1._id, title: 'Seaside Villa with Pool', description: 'Private pool and ocean views.', area: 'Cascais', city: 'Lisbon', country: 'Portugal', pricePerNight: 480, propertyType: 'villa', maxGuests: 8, bedrooms: 4, bathrooms: 3, amenities: ['wifi', 'pool', 'parking'] },
    { owner: owner1._id, title: 'Cozy Studio near Metro', description: 'Compact studio near public transit.', area: 'Baixa', city: 'Lisbon', country: 'Portugal', pricePerNight: 75, propertyType: 'studio', maxGuests: 2, bedrooms: 0, bathrooms: 1, amenities: ['wifi', 'kitchen'] },
    { owner: owner2._id, title: 'Modern Apartment in Malasaña', description: 'Stylish apartment in historic district.', area: 'Malasaña', city: 'Madrid', country: 'Spain', pricePerNight: 160, propertyType: 'apartment', maxGuests: 4, bedrooms: 2, bathrooms: 2, amenities: ['wifi', 'elevator'] },
    { owner: owner2._id, title: 'Charming Hillside Cottage', description: 'Quiet stone cottage.', area: 'Sierra', city: 'Madrid', country: 'Spain', pricePerNight: 140, propertyType: 'cottage', maxGuests: 5, bedrooms: 3, bathrooms: 2, amenities: ['wifi', 'fireplace'] },
    { owner: owner2._id, title: 'Downtown Skyline Condo', description: 'High-floor condo with gym.', area: 'Eixample', city: 'Barcelona', country: 'Spain', pricePerNight: 210, propertyType: 'condo', maxGuests: 4, bedrooms: 2, bathrooms: 2, amenities: ['wifi', 'gym'] },
    { owner: owner1._id, title: 'Rustic Mountain Cabin', description: 'Cabin with hot tub.', area: 'Serra', city: 'Guarda', country: 'Portugal', pricePerNight: 155, propertyType: 'cabin', maxGuests: 6, bedrooms: 3, bathrooms: 2, amenities: ['wifi', 'hot_tub'] },
    { owner: owner2._id, title: 'Private Room in Flat', description: 'Budget city stay.', area: 'Gràcia', city: 'Barcelona', country: 'Spain', pricePerNight: 45, propertyType: 'room', maxGuests: 1, bedrooms: 1, bathrooms: 1, amenities: ['wifi'], isActive: false },
  ];

  const properties = await Property.create(
    propSeeds.map((p, i) => ({
      owner: p.owner,
      title: p.title,
      description: p.description,
      location: { address: `${10 + i} Main St`, area: p.area, city: p.city, country: p.country },
      pricePerNight: p.pricePerNight,
      propertyType: p.propertyType,
      maxGuests: p.maxGuests,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      amenities: p.amenities,
      images: img(i),
      isActive: p.isActive ?? true,
    })),
  );
  console.log(`Created ${properties.length} properties.`);

  const ownerOf = (index: number) => properties[index].owner as Types.ObjectId;
  const priceOf = (index: number) => properties[index].pricePerNight;
  const customerMap: Record<string, Types.ObjectId> = {
    c1: customer1._id,
    c2: customer2._id,
    c3: customer3._id,
  };

  // Seed Bookings
  const bookingSeeds: BookingSeed[] = [
    { customerKey: 'c1', propertyIndex: 0, offsetInDays: -12, nights: 4, guests: 2, status: 'confirmed' },
    { customerKey: 'c2', propertyIndex: 1, offsetInDays: -20, nights: 5, guests: 6, status: 'confirmed' },
    { customerKey: 'c3', propertyIndex: 3, offsetInDays: -8, nights: 3, guests: 2, status: 'confirmed' },
    { customerKey: 'c1', propertyIndex: 2, offsetInDays: 7, nights: 3, guests: 2, status: 'confirmed' },
    { customerKey: 'c2', propertyIndex: 5, offsetInDays: 14, nights: 4, guests: 3, status: 'confirmed' },
    { customerKey: 'c3', propertyIndex: 0, offsetInDays: 20, nights: 2, guests: 1, status: 'cancelled' },
  ];

  for (const s of bookingSeeds) {
    await makeBooking(
      customerMap[s.customerKey],
      ownerOf(s.propertyIndex),
      properties[s.propertyIndex]._id,
      priceOf(s.propertyIndex),
      s,
    );
  }

  // Run lifecycle job to transition past bookings to completed
  await markCompletedBookings();

  // Seed Reviews for completed stays
  const completedBookings = await Booking.find({ status: 'completed' }).lean();
  for (const b of completedBookings) {
    await Review.create({
      customer: b.customer,
      property: b.property,
      booking: b._id,
      owner: b.owner,
      rating: 5,
      comment: 'Excellent stay! Highly recommended.',
    });
  }

  // Recompute rating aggregates
  const ratingAgg = await Review.aggregate<{ _id: Types.ObjectId; avg: number; count: number }>([
    { $group: { _id: '$property', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Promise.all(
    ratingAgg.map((r) =>
      Property.updateOne(
        { _id: r._id },
        { $set: { ratingAvg: Math.round(r.avg * 10) / 10, ratingCount: r.count } },
      ),
    ),
  );

  // Seed Wishlists
  await Wishlist.create([
    { customer: customer1._id, property: properties[1]._id },
    { customer: customer1._id, property: properties[6]._id },
    { customer: customer3._id, property: properties[0]._id },
  ]);

  console.log('Seed completed successfully.');
  console.table([
    { role: 'admin', email: 'admin@stayhub.dev', password: DEMO_PASSWORD },
    { role: 'owner', email: 'owner@stayhub.dev', password: DEMO_PASSWORD },
    { role: 'customer', email: 'customer@stayhub.dev', password: DEMO_PASSWORD },
  ]);
}

seed()
  .then(async () => {
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Seed failed:', err);
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });
