import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

let isConnected = false;

// Event listeners 
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

export async function connectDatabase(uri: string = process.env.MONGODB_URI): Promise<typeof mongoose> {
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