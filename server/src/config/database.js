import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export async function connectDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn.connection;
  } catch (error) {
    console.error(`[Database] Connection Error with primary URI: ${error.message}`);
    
    // Automatic fallback to local MongoDB if primary Atlas connection fails
    const localUri = 'mongodb://127.0.0.1:27017/cricket_laws_assistant';
    if (env.MONGODB_URI !== localUri) {
      console.warn(`[Database] Attempting connection to local MongoDB fallback: ${localUri}...`);
      try {
        const localConn = await mongoose.connect(localUri, { serverSelectionTimeoutMS: 5000 });
        isConnected = true;
        console.log(`[Database] MongoDB Connected (Local Fallback): ${localConn.connection.host}/${localConn.connection.name}`);
        return localConn.connection;
      } catch (localErr) {
        console.error(`[Database] Local fallback also failed: ${localErr.message}`);
      }
    }

    isConnected = false;
    throw error;
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[Database] MongoDB Disconnected gracefully.');
  }
}

export function checkDatabaseHealth() {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };

  return {
    status: state === 1 ? 'ok' : 'degraded',
    state: states[state] || 'unknown',
    readyState: state
  };
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[Database] Lost MongoDB connection.');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('[Database] Reconnected to MongoDB.');
});
