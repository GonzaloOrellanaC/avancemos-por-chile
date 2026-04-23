import mongoose from 'mongoose';
import * as dns from 'dns';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/avancemos';

export async function connectDB() {
  try {
    if (mongoose.connection.readyState >= 1) return;
    console.log('Connecting to MongoDB...', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error: any) {
    console.error('MongoDB connection error:', error);

    // If the error is due to SRV DNS lookup being refused, try setting fallback DNS servers and retry once
    const isSrvQueryError = error && (
      error.code === 'ECONNREFUSED' ||
      error.syscall === 'querySrv' ||
      (error.message && error.message.includes('querySrv'))
    );

    if (isSrvQueryError) {
      try {
        const fallbackServers = ['8.8.8.8', '1.1.1.1'];
        console.log('Detected SRV DNS lookup error. Setting fallback DNS servers:', fallbackServers.join(', '));
        dns.setServers(fallbackServers);

        console.log('Retrying MongoDB connection after DNS fallback...');
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected successfully (after DNS fallback)');
        return;
      } catch (retryError) {
        console.error('Retry after DNS fallback failed:', retryError);
      }
    }

    process.exit(1);
  }
}
