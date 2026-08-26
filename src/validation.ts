import { z } from 'zod';

export const patientQuerySchema = z.object({
  patientId: z.string().uuid("Invalid patient ID format. Must be a UUID."),
  query: z.string().min(5, "Query must be at least 5 characters long.").max(500, "Query cannot exceed 500 characters."),
});

export const llmResponseSchema = z.object({
  response: z.string().min(1, "LLM response cannot be empty."),
});
