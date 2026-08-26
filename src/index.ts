import express from 'express';
import dotenv from 'dotenv';
import { patientQuerySchema, llmResponseSchema } from './validation';
import { redactPIIMiddleware } from './piiRedaction';
import { tenantScopeMiddleware } from './middleware';
import { getLLMResponse } from './llmService';
import { getVectorContext } from './vectorDb';

dotenv.config();

const app = express();
app.use(express.json());

// PII Redaction Middleware (applied before logging/storage/LLM)
app.use(redactPIIMiddleware);

// Tenant Scoping Middleware (applied to ensure clinic_id is present)
app.use(tenantScopeMiddleware);

app.post('/patient-query', async (req, res) => {
  const clinicId = req.headers['x-clinic-id'] as string; // Ensured by tenantScopeMiddleware

  try {
    // 1. Validate incoming payload
    const validatedPayload = patientQuerySchema.parse(req.body);
    const { patientId, query } = validatedPayload;

    // 2. Retrieve context from Vector DB with tenant scoping
    const vectorContext = await getVectorContext(query, clinicId);

    // 3. Prepare prompt for LLM
    const prompt = `Patient ID: ${patientId}. Clinic ID: ${clinicId}. User query: "${query}". Context from healthcare knowledge base: "${vectorContext}". Based on this, provide a concise and helpful response.`;

    // 4. Get LLM-generated response and measure latency
    const { response: llmRawResponse, latency } = await getLLMResponse(prompt);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AI Microservice listening on port ${PORT}`);
});
