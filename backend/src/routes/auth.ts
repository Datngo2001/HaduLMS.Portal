import bcrypt from "bcryptjs";
import express from "express";
import { body } from "express-validator";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import { prisma } from "../index";
import { AuthenticatedRequest, authenticateToken } from "../middleware/auth";
import {
  asyncHandler,
  handleValidationErrors,
  sendResponse,
} from "../utils/response";

const router = express.Router();

// Helper function to set authentication cookie
const setAuthCookie = (res: express.Response, token: string) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("authToken", token, {
    httpOnly: true, // Prevents XSS attacks by making cookie inaccessible to JavaScript
    secure: isProduction, // Use HTTPS in production
    sameSite: isProduction ? "none" : "lax", // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
};

// Register
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("firstName").trim().isLength({ min: 1 }).escape(),
    body("lastName").trim().isLength({ min: 1 }).escape(),
    body("password").isLength({ min: 6 }),
    body("role").optional().isIn(["STUDENT", "TEACHER", "ADMIN"]),
  ],
  asyncHandler(async (req: express.Request, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { email, firstName, lastName, password, role = "STUDENT" } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendResponse(
        res,
        400,
        null,
        "User already exists with this email"
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret
    );

    // Set HTTP-only cookie
    setAuthCookie(res, token);

    return sendResponse(res, 201, { user, token }, undefined);
  })
);

// Login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 1 }),
  ],
  asyncHandler(async (req: express.Request, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return sendResponse(res, 401, null, "Invalid credentials");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendResponse(res, 401, null, "Invalid credentials");
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret
    );

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    // Set HTTP-only cookie
    setAuthCookie(res, token);

    return sendResponse(
      res,
      200,
      { user: userWithoutPassword, token },
      undefined
    );
  })
);

// Google OAuth Login
router.post(
  "/google",
  [body("token").notEmpty().withMessage("Google token is required")],
  asyncHandler(async (req: express.Request, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { token, userInfo } = req.body;

    try {
      // Verify Google access token by fetching user info
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`
      );

      if (!response.ok) {
        return sendResponse(res, 400, null, "Invalid Google token");
      }

      const googleUserInfo: any = await response.json();
      const { email, given_name, family_name, picture } = googleUserInfo;

      if (!email) {
        return sendResponse(res, 400, null, "Email not provided by Google");
      }

      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
      });

      // If user doesn't exist, create a new one
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            firstName: given_name || "Unknown",
            lastName: family_name || "User",
            password: "", // Google users don't have a password
            role: "STUDENT", // Default role for Google sign-ups
            avatar: picture,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
            createdAt: true,
          },
        });
      } else {
        // Update avatar if provided by Google and not already set
        if (picture && !user.avatar) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { avatar: picture },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              avatar: true,
              createdAt: true,
            },
          });
        }
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error("JWT_SECRET is not defined");
      }

      const jwtToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        jwtSecret
      );

      // Set HTTP-only cookie
      setAuthCookie(res, jwtToken);

      return sendResponse(res, 200, { user, token: jwtToken }, undefined);
    } catch (error: any) {
      console.error("Google OAuth error:", error);
      return sendResponse(res, 400, null, "Failed to authenticate with Google");
    }
  })
);

// Get current user (for session persistence)
router.get(
  "/me",
  authenticateToken,
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
      });

      if (!user) {
        return sendResponse(res, 404, null, "User not found");
      }

      return sendResponse(res, 200, { user }, undefined);
    } catch (error) {
      return sendResponse(res, 500, null, "Internal server error");
    }
  }
);

// Logout endpoint
router.post("/logout", (req: express.Request, res: express.Response) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });

  return sendResponse(
    res,
    200,
    { message: "Logged out successfully" },
    undefined
  );
});

export default router;
