import { Router } from 'express';
import * as ctrl from '../controllers/upload.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { uploadSingle, uploadMultiple } from '../middleware/upload';

const router = Router();

// Uploads require authenticated owner or admin
router.use(authenticate, authorize('owner', 'admin'));

// Single image upload
router.post('/image', uploadSingle, ctrl.uploadImage);

// Multiple image upload (up to 10 images)
router.post('/images', uploadMultiple, ctrl.uploadMultipleImages);

export default router;
