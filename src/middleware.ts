import { Request, Response, NextFunction } from 'express';

export const tenantScopeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clinicId = req.headers['x-clinic-id'] as string;

  if (!clinicId) {
    return res.status(401).json({ error: 'Unauthorized: x-clinic-id header is required.' });
  }

  // In a real application, you would also validate the clinicId against a list of active clinics
  // and ensure the authenticated user/service has access to this clinicId.

  // Attach clinicId to the request object for downstream use
  (req as any).clinicId = clinicId;
  next();
};
