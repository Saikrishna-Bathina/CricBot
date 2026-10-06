import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';

describe('Discrepancy and Bug Reporting API Integration', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('POST /api/v1/reports should record a valid discrepancy report with proof', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .send({
        category: 'law-discrepancy',
        lawReference: 'Law 28.3.2',
        description: 'Ball hitting helmet should award 5 penalty runs to the batting side',
        proofEvidence: 'MCC 2017 Code 3rd Edition Law 28.3.2 Protective helmet placed on ground',
        userEmail: 'umpire.test@icc-cricket.com',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.category).toBe('law-discrepancy');
    expect(res.body.data.lawReference).toBe('Law 28.3.2');
    expect(res.body.data.status).toBe('pending');
  });

  it('POST /api/v1/reports should reject reports lacking mandatory proof or description', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .send({
        category: 'law-discrepancy',
        description: '',
        proofEvidence: '',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  it('GET /api/v1/reports should return a list of logged reports', async () => {
    const res = await request(app).get('/api/v1/reports');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });
});
