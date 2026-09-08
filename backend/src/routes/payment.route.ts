import { Router } from 'express';
import * as ctrl from '../controllers/payment.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createPaymentIntentBody, verifyPaymentBody } from '../validators/payment.validator';

const router = Router();

// Public payment configuration (returns public key_id and test/live mode)
router.get('/config', ctrl.getConfig);

// All payment operations require authentication
router.use(authenticate);

router.post('/intent', validate({ body: createPaymentIntentBody }), ctrl.createIntent);
router.post('/verify', validate({ body: verifyPaymentBody }), ctrl.verify);
router.get('/booking/:bookingId', ctrl.getByBooking);

export default router;
