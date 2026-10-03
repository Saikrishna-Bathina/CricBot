import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Health API Routes', () => {
  it('GET /api/v1/health should return 200 with service metadata', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('ai-cricket-laws-assistant-api');
    expect(res.body.version).toBe('1.0.0');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('GET /api/v1/health/ready should return dependency checks', async () => {
    const res = await request(app).get('/api/v1/health/ready');
    // In disconnected test environment status can be 503 degraded, or 200 if connected
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('dependencies');
    expect(res.body.dependencies).toHaveProperty('database');
    expect(res.body.dependencies).toHaveProperty('llmProvider');
    expect(res.body.dependencies).toHaveProperty('embeddingProvider');
  });

  it('GET /api/v1/non-existent-route should return consistent 404 error format', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(res.body.error).toHaveProperty('message');
  });
});
