import { Router } from 'express';
import * as ctrl from '../controllers/wishlist.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { addWishlistBody, wishlistIdParams, listWishlistQuery } from '../validators/wishlist.validator';

const router = Router();

router.use(authenticate, authorize('customer'));

router.get('/', validate({ query: listWishlistQuery }), ctrl.list);
router.get('/ids', ctrl.listIds);
router.post('/', validate({ body: addWishlistBody }), ctrl.add);
router.delete('/:propertyId', validate({ params: wishlistIdParams }), ctrl.remove);

export default router;
