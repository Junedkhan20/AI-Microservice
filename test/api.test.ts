import request from 'supertest';
import express from 'express';
import { patientQuerySchema, llmResponseSchema } from '../src/validation';
import { redactPIIMiddleware } from '../src/piiRedaction';
import { tenantScopeMiddleware } from '../src/middleware';
import { getLLMResponse } from '../src/llmService';
import { getVectorContext } from '../src/vectorDb';

// Mock the external dependencies
jest.mock('../src/llmService');
jest.mock('../src/vectorDb');

const mockGetLLMResponse = getLLMResponse as jest.Mock;
const mockGetVectorContext = getVectorContext as jest.Mock;

const app = express();
app.use(express.json());
app.use(redactPIIMiddleware);
app.use(tenantScopeMiddleware);

app.post('/patient-query', async (req, res) => {
  const clinicId = req.headers['x-clinic-id'] as string; // Ensured by tenantScopeMiddleware

  try {
    // 1. Validate incoming payload
    const validatedPayload = patientQuerySchema.parse(req.body);
    const { patientId, query } = validatedPayload;

    // 2. Retrieve context from Vector DB with tenant scoping
    const vectorContext = await mockGetVectorContext(query, clinicId);

    // 3. Prepare prompt for LLM
    const prompt = `Patient ID: ${patientId}. Clinic ID: ${clinicId}. User query: "${query}". Context from healthcare knowledge base: "${vectorContext}". Based on this, provide a concise and helpful response.`;

    // 4. Get LLM-generated response and measure latency
    const { response: llmRawResponse, latency } = await mockGetLLMResponse(prompt);

    // 5. Validate outgoing LLM response
    const validatedLLMResponse = llmResponseSchema.parse({ response: llmRawResponse });

    // 6. Send response
    res.json({
      ...validatedLLMResponse,
      latencyMs: latency,
      clinicId: clinicId,
      patientId: patientId,
    });
  } catch (error: any) {
    if (error.name === 'ZodError' || error.constructor.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid payload', details: error.issues || error.errors });
    }
    console.error('Error processing patient query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

describe('AI Microservice API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process a valid patient query and return an LLM response', async () => {
    mockGetVectorContext.mockResolvedValue('Relevant medical context.');
    mockGetLLMResponse.mockResolvedValue({ response: 'Hello, how can I help you today?', latency: 150 });

    const payload = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      query: 'What are the symptoms of flu?',
    };

    const res = await request(app)
      .post('/patient-query')
      .set('x-clinic-id', 'clinic-123')
      .send(payload);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('response', 'Hello, how can I help you today?');
    expect(res.body).toHaveProperty('latencyMs');
    expect(res.body.latencyMs).toBeGreaterThan(0);
    expect(mockGetVectorContext).toHaveBeenCalledWith(payload.query, 'clinic-123');
    expect(mockGetLLMResponse).toHaveBeenCalledWith(expect.stringContaining('Relevant medical context.'));
  });

  it('should reject an invalid patientId', async () => {
    const payload = {
      patientId: 'invalid-uuid',
      query: 'How do I book an appointment?',
    };

    const res = await request(app)
      .post('/patient-query')
      .set('x-clinic-id', 'clinic-123')
      .send(payload);

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('Invalid payload');
    expect(res.body.details[0].message).toEqual('Invalid patient ID format. Must be a UUID.');
  });

  it('should reject a short query', async () => {
    const payload = {
      patientId: '123e4567-e89b-12d3-a456-426614174000',
      query: 'hi',
    };

    const res = await request(app)
      .post('/patient-query')
      .set('x-clinic-id', 'clinic-123')
      .send(payload);

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('Invalid payload');
    expect(res.body.details[0].message).toEqual('Query must be at least 5 characters long.');
  });

  it('should reject requests without x-clinic-id header', async () => {
    const payload = {
      patientId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
      query: 'General query',
    };

    const res = await request(app)
      .post('/patient-query')
      .send(payload);

    expect(res.statusCode).toEqual(401);
    expect(res.body.error).toEqual('Unauthorized: x-clinic-id header is required.');
  });

});
