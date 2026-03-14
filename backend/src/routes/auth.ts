import express from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { AuthController } from "../presentation/controllers/AuthController";
import { asyncHandler, handleValidationErrors } from "../utils/response";

const router = express.Router();
const authController = new AuthController();

// Login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 1 }),
  ],
  asyncHandler(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (handleValidationErrors(req, res)) return;
    await authController.login(req, res);
  }),
);

// Google OAuth Login
router.post(
  "/google",
  [body("token").notEmpty().withMessage("Google token is required")],
  asyncHandler(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (handleValidationErrors(req, res)) return;
    await authController.googleLogin(req, res);
  }),
);

// Get current user (for session persistence)
router.get(
  "/me",
  authenticateToken,
  asyncHandler(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await authController.getMe(req, res);
  }),
);

// Logout endpoint
router.post("/logout", authController.logout);

export default router;
