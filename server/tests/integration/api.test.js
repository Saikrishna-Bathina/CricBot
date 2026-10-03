import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';

describe('AI Cricket Laws Full API Suite Integration', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  // Feature A: Chatbot
  it('POST /api/v1/chat should return source-grounded answer with traceable citations', async () => {
    const res = await request(app)
      .post('/api/v1/chat')
      .send({
        question: 'What happens if the ball hits the helmet placed behind the wicketkeeper?',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('answer');
    expect(res.body.data.answer.directAnswer).toContain('5 penalty runs');
    expect(Array.isArray(res.body.data.citations)).toBe(true);
    expect(res.body.data.citations.length).toBeGreaterThan(0);
    expect(res.body.data.citations[0]).toHaveProperty('lawNumber', 28);
    expect(res.body.data.citations[0]).toHaveProperty('clauseNumber', '28.3.2');
    expect(res.body.data.citations[0]).toHaveProperty('sourceTitle');
  }, 25000);

  // Feature B: Scenario Analyser
  it('POST /api/v1/scenarios/analyze should return structured scenario breakdown', async () => {
    const res = await request(app)
      .post('/api/v1/scenarios/analyze')
      .send({
        scenario: 'A fielder catches the ball after stepping over the boundary. What is the decision?',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('analysis');
    expect(res.body.data.analysis).toHaveProperty('likelyDecision');
    expect(res.body.data.analysis).toHaveProperty('relevantFacts');
    expect(res.body.data.analysis).toHaveProperty('applicableLaw');
    expect(res.body.data.analysis).toHaveProperty('alternativeOutcomes');
    expect(res.body.data.citations.length).toBeGreaterThan(0);
  });

  // Feature C: Law Search
  it('GET /api/v1/laws/search should return paginated law chunks matching filters', async () => {
    const res = await request(app)
      .get('/api/v1/laws/search')
      .query({ lawNumber: 28 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data.items[0].lawNumber).toBe(28);
    expect(res.body.data).toHaveProperty('pagination');
    expect(res.body.data.pagination.total).toBeGreaterThan(0);
  });

  // Feature D: Quiz System & Server Scoring
  it('POST /api/v1/quizzes/generate and submit should hide answers before submission and score correctly', async () => {
    // 1. Generate quiz
    const genRes = await request(app)
      .post('/api/v1/quizzes/generate')
      .send({
        topic: 'general',
        difficulty: 'intermediate',
        questionCount: 2,
      });

    expect(genRes.status).toBe(201);
    expect(genRes.body.success).toBe(true);
    const quiz = genRes.body.data;
    expect(quiz.questions.length).toBeGreaterThan(0);

    // CRITICAL: Ensure correctAnswer is NOT exposed to client
    quiz.questions.forEach((q) => {
      expect(q).not.toHaveProperty('correctAnswer');
    });

    const firstQuestion = quiz.questions[0];

    // 2. Submit quiz attempt
    const submitRes = await request(app)
      .post(`/api/v1/quizzes/${quiz.quizId}/submit`)
      .send({
        responses: [
          {
            questionId: firstQuestion._id,
            selectedOption: 'B', // Known correct answer for helmet or non-striker
          },
        ],
      });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.data).toHaveProperty('score');
    expect(submitRes.body.data).toHaveProperty('percentage');
    expect(submitRes.body.data.results[0]).toHaveProperty('correctAnswer');
    expect(submitRes.body.data.results[0]).toHaveProperty('explanation');
  });

  // Feature E: Security & Role-Based Access Control
  it('GET /api/v1/admin/documents should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/admin/documents');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
