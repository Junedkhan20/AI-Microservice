import { Request, Response, NextFunction } from 'express';

const redactPII = (text: string): string => {
  // Regex patterns for common PII:
  // Phone numbers (e.g., +91-9876543210, 98765 43210, (123) 456-7890)
  let redactedText = text.replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b|\b(diabetes|cancer|HIV|AIDS|blood pressure)\b/gi, '[GENERIC_PII_REDACTED_PLACEHOLDER_LONG_ENOUGH]');
  // Aadhar numbers (12 digits, often in groups of 4)
  redactedText = redactedText.replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, '[AADHAR_REDACTED]');
  // Names (simple example, full NLP would be better)
  redactedText = redactedText.replace(/\b(John Doe|Jane Smith)\b/gi, '[PATIENT_NAME]');

  // Add more regex/NLP patterns as needed for comprehensive PII detection

  return redactedText;
};

export const redactPIIMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && req.body.query) {
    // Assuming the patient query is in req.body.query
    // Store the original query before redaction if needed for auditing (with appropriate access controls)
    (req as any).originalQuery = req.body.query;
    req.body.query = redactPII(req.body.query);
  }
  next();
};
