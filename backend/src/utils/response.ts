import { validationResult, ValidationError } from 'express-validator';
import { Request, Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  data?: T,
  error?: string
): Response => {
  const response: ApiResponse<T> = {
    success: statusCode < 400,
    ...(data && { data }),
    ...(error && { error }),
  };

  return res.status(statusCode).json(response);
};

export const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: 'Validation failed',
      errors: errors.array(),
    };
    res.status(400).json(response);
    return true;
  }
  return false;
};

export const asyncHandler = (fn: (req: Request, res: Response, next: any) => Promise<any>) => 
  (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };