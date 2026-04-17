import type { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};
