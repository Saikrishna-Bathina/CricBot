import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { env } from './config/env.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import scenarioRoutes from './routes/scenarioRoutes.js';
import lawSearchRoutes from './routes/lawSearchRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';

const app = express();

// Trust reverse proxy (e.g. Render, Vercel, AWS ALB) for correct IP rate-limiting & HTTPS detection
app.set('trust proxy', 1);

// Security headers with Helmet
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", ...env.allowedOrigins, 'https://*.google.com'],
      },
    },
  })
);

// Structured Request ID Middleware
app.use((req, res, next) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = reqId;
  res.setHeader('x-request-id', reqId);
  next();
});

// Production-ready CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl, health probes)
      if (!origin) return callback(null, true);

      // Check allowed origins list
      if (env.allowedOrigins.includes('*') || env.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In non-production environments, permit local development origins
      if (env.NODE_ENV !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      callback(new AppError(`Origin '${origin}' is not permitted by CORS policy.`, 403, 'CORS_REJECTED'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
  })
);

// Request parsing with reasonable limits (prevent denial-of-service memory exhaustion)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Structured logging with request IDs
if (env.NODE_ENV !== 'test') {
  morgan.token('id', (req) => req.id || '-');
  const logFormat =
    env.NODE_ENV === 'production'
      ? '[:date[iso]] [:id] :remote-addr ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms'
      : ':id :method :url :status :response-time ms';
  app.use(morgan(logFormat));
}

// Rate Limiting: General API Limiter (disabled in test)
if (env.NODE_ENV !== 'test') {
  const apiLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/health'),
    message: {
      success: false,
      error: {
        message: 'Too many requests from this IP address. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.RATE_LIMIT_AUTH_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        message: 'Too many authentication attempts. Please try again after 15 minutes.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
      },
    },
  });

  app.use('/api/v1', apiLimiter);
  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/register', authLimiter);
}

// API Routes
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', chatRoutes);
app.use('/api/v1', scenarioRoutes);
app.use('/api/v1', lawSearchRoutes);
app.use('/api/v1', quizRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/reports', reportRoutes);

// Catch 404
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
