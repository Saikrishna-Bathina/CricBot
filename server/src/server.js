import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

let server;

async function startServer() {
  try {
    // Attempt database connection
    await connectDatabase();
    
    server = app.listen(env.PORT, () => {
      console.log(`[Server] AI Cricket Laws API running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      console.log(`[Server] Health check: http://localhost:${env.PORT}/api/v1/health`);
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`[Server] Received ${signal}. Closing gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDatabase();
      process.exit(0);
    });
  } else {
    await disconnectDatabase();
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
