import mongoose from 'mongoose';
import { logger } from './logger';

mongoose.set('strictQuery', true);

let isConnected = false;

// Event listeners 
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

export async function connectDatabase(uri: string = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/airbn'): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  await mongoose.connect(uri, {
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    autoIndex: process.env.NODE_ENV !== 'production',
  });

  isConnected = true;
  return mongoose;
}

// Build schema-declared indexes explicitly in production
export async function ensureIndexes(): Promise<void> {
  const models = Object.values(mongoose.models);
  await Promise.all(
    models.map((m) =>
      m.syncIndexes().catch((err) => {
        logger.error({ err, model: m.modelName }, 'Failed to sync indexes');
      }),
    ),
  );
  logger.info(`Ensured indexes for ${models.length} model(s)`);
}


export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('MongoDB connection closed');
}

/** 0: disconnected, 1: connected, 2: connecting, 3: disconnecting */
export function getDbState(): number {
  return mongoose.connection.readyState;
}

/** Check if current connection supports transactions */
export function supportsTransactions(): boolean {
  try {
    const client = mongoose.connection.getClient?.();
    const topologyType = (client as any)?.topology?.description?.type;
    return (
      topologyType === 'ReplicaSetWithPrimary' ||
      topologyType === 'Sharded' ||
      topologyType === 'LoadBalanced'
    );
  } catch {
    return false;
  }
}

export { mongoose };