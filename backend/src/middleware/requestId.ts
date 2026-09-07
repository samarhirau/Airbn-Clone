import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';


export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'];
  const id = (Array.isArray(incoming) ? incoming[0] : incoming) || crypto.randomUUID();
  req.id = id;
  res.setHeader('x-request-id', id);
  next();
}
