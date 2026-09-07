import { Router } from 'express';
import * as ctrl from '../controllers/property.controller';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { idParam } from '../validators/common';
import {
  listPropertiesQuery,
  createPropertyBody,
  updatePropertyBody,
} from '../validators/property.validator';

const router = Router();

// Public search and filtering
router.get('/', validate({ query: listPropertiesQuery }), ctrl.list);

// Public detail — optional auth lets an owner/admin view their own inactive listing
router.get('/:id', optionalAuthenticate, validate({ params: idParam }), ctrl.getOne);

// Create — owners (and admins) only
router.post('/', authenticate, authorize('owner', 'admin'), validate({ body: createPropertyBody }), ctrl.create);

// Update — owner of the property or admin (enforced in the service)
router.patch(
  '/:id',
  authenticate,
  authorize('owner', 'admin'),
  validate({ params: idParam, body: updatePropertyBody }),
  ctrl.update,
);

// Delete — owner of the property or admin
router.delete('/:id', authenticate, authorize('owner', 'admin'), validate({ params: idParam }), ctrl.remove);

export default router;
