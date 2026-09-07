import { Router } from 'express';
import healthRoute from './health.route';
import authRoute from './auth.route';
import propertyRoute from './property.route';
import bookingRoute from './booking.route';
import reviewRoute from './review.route';
import wishlistRoute from './wishlist.route';
import ownerRoute from './owner.route';
import adminRoute from './admin.route';
import couponRoute from './coupon.route';
import uploadRoute from './upload.route';

const router = Router();

router.use('/health', healthRoute);
router.use('/auth', authRoute);
router.use('/properties', propertyRoute);
router.use('/bookings', bookingRoute);
router.use('/reviews', reviewRoute);
router.use('/wishlist', wishlistRoute);
router.use('/owner', ownerRoute);
router.use('/admin', adminRoute);
router.use('/coupons', couponRoute);
router.use('/upload', uploadRoute);

export default router;
