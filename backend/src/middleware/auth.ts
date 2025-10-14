import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export enum UserRole {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  body: any;
  params: any;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Check for token in Authorization header (Bearer token)
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.split(" ")[1];

  // If no Authorization header, check for token in cookies
  if (!token) {
    token = req.cookies?.authToken;
  }

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }
    req.user = user as AuthenticatedUser;
    next();
  });
};

export const requireRole = (roles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: "Insufficient permissions",
        required: roles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
};

// Helper functions for common role checks
export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requireTeacher = requireRole([UserRole.ADMIN, UserRole.TEACHER]);
export const requireStudent = requireRole([
  UserRole.ADMIN,
  UserRole.TEACHER,
  UserRole.STUDENT,
]);
