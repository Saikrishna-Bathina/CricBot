import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root or parent
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEFAULT_JWT_SECRET = 'cricket-laws-rag-secret-key-change-in-production-min-32-chars';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  ALLOWED_ORIGINS: z.string().optional(),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/cricket_laws_assistant'),
  JWT_SECRET: z.string().default(DEFAULT_JWT_SECRET),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100), // 100 requests per 15 min per IP
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(10), // 10 auth attempts per 15 min per IP

  // LLM Configuration
  LLM_PROVIDER: z.enum(['gemini', 'openai', 'mock']).default('gemini'),
  LLM_API_KEY: z.string().optional().default(''),
  LLM_MODEL: z.string().default('gemini-1.5-flash'),

  // Embeddings Configuration
  EMBEDDING_PROVIDER: z.enum(['gemini', 'openai', 'local']).default('local'),
  EMBEDDING_API_KEY: z.string().optional().default(''),
  EMBEDDING_MODEL: z.string().default('text-embedding-004'),
  EMBEDDING_DIMENSIONS: z.coerce.number().default(768),
  VECTOR_INDEX_NAME: z.string().default('cricket_vector_index'),

  // Storage
  UPLOAD_STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  UPLOAD_DIR: z.string().default('uploads'),

  // Python RAG Service Integration
  USE_PYTHON_RAG: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  PYTHON_RAG_SERVICE_URL: z.string().default('http://127.0.0.1:8000'),
  PYTHON_RAG_TIMEOUT_MS: z.coerce.number().default(15000),

  // Email Notification Configuration
  GMAIL_USER: z.string().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),
  DEVELOPER_EMAIL: z.string().default('saikrishnabathina999@gmail.com'),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production') {
    if (data.JWT_SECRET === DEFAULT_JWT_SECRET || data.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'In production, JWT_SECRET must be a custom secret with at least 32 characters and cannot use the development default.',
      });
    }

    if (!data.MONGODB_URI || data.MONGODB_URI.includes('127.0.0.1') || data.MONGODB_URI.includes('localhost')) {
      console.warn('[Security Warning] MONGODB_URI in production is pointing to localhost. Ensure this is intentional for your hosting architecture.');
    }
  }
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('[Configuration Error] Invalid environment variables configuration:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  throw new Error('Environment configuration validation failed');
}

// Compute array of allowed origins for CORS
const rawOrigins = [
  ...parsedEnv.data.CLIENT_URL.split(','),
  ...(parsedEnv.data.ALLOWED_ORIGINS ? parsedEnv.data.ALLOWED_ORIGINS.split(',') : [])
]
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  ...parsedEnv.data,
  allowedOrigins: rawOrigins.length > 0 ? rawOrigins : ['http://localhost:5173'],
};
