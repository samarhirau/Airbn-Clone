import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { registerBody, loginBody, updateProfileBody } from '../validators/auth.validator';

const router = Router();

router.post('/register', validate({ body: registerBody }), ctrl.register);
router.post('/login', validate({ body: loginBody }), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);
router.get('/me', authenticate, ctrl.me);
router.patch('/me', authenticate, validate({ body: updateProfileBody }), ctrl.updateProfile);

export default router;
