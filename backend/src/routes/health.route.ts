import { Router } from 'express';
import mongoose from 'mongoose';
import { isRedisReady } from '../config/redis';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

const DB_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

router.get('/', (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  sendSuccess(res, {
    status: dbReady ? 'ok' : 'degraded',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    dependencies: {
      mongodb: DB_STATES[mongoose.connection.readyState] ?? 'unknown',
      redis: process.env.redisEnabled ? (isRedisReady() ? 'connected' : 'unavailable') : 'disabled',
    },
  });
});

export default router;
