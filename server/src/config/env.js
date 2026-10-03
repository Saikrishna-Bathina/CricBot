import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root or parent
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/cricket_laws_assistant'),
  JWT_SECRET: z.string().default('cricket-laws-rag-secret-key-change-in-production-min-32-chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
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
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables configuration:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  throw new Error('Environment configuration validation failed');
}

export const env = parsedEnv.data;
