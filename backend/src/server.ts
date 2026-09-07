import { createApp } from './app.ts';
import { connectDatabase } from '../config/db.ts';

async function startServer() {
  try {
    // 1. Database connect 
    await connectDatabase();
    console.log('MongoDB connected successfully');

    // 2. Express app 
    const app = createApp();
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();