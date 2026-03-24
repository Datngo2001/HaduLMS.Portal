import express from "express";
import { body, param, query } from "express-validator";
import {
  authenticateToken,
  requireAdmin,
} from "../middleware/auth";
import { UserController } from "../controllers/UserController";
import { asyncHandler } from "../utils/response";

const router = express.Router();
const userController = new UserController();

// Get current user profile
router.get(
  "/profile",
  authenticateToken,
  asyncHandler(userController.getProfile),
);

// Get user's enrollments
router.get(
  "/enrollments",
  authenticateToken,
  asyncHandler(userController.getEnrollments),
);

// Get user's created courses (for teachers/admins)
router.get(
  "/courses",
  authenticateToken,
  asyncHandler(userController.getCourses),
);

// Update user profile
router.put(
  "/profile",
  authenticateToken,
  asyncHandler(userController.updateProfile),
);

// Admin-only routes for user management

// Get all users (Admin only)
router.get(
  "/",
  authenticateToken,
  requireAdmin,
  [
    query("search").optional().isString(),
    query("role").optional().isIn(["ADMIN", "TEACHER", "STUDENT"]),
    query("status").optional().isIn(["active", "inactive"]),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  asyncHandler(userController.getUsers),
);

// Get user by ID (Admin only)
router.get(
  "/:id",
  authenticateToken,
  requireAdmin,
  [param("id").isString()],
  asyncHandler(userController.getUserById),
);

// Create user (Admin only)
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  [
    body("email").isEmail().normalizeEmail(),
    body("firstName").trim().isLength({ min: 1 }).escape(),
    body("lastName").trim().isLength({ min: 1 }).escape(),
    body("password").isLength({ min: 6 }),
    body("role").isIn(["ADMIN", "TEACHER", "STUDENT"]),
    body("phone").optional().isMobilePhone("any"),
  ],
  asyncHandler(userController.createUser),
);

// Update user (Admin only)
router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  [
    param("id").isString(),
    body("email").optional().isEmail().normalizeEmail(),
    body("firstName").optional().trim().isLength({ min: 1 }).escape(),
    body("lastName").optional().trim().isLength({ min: 1 }).escape(),
    body("role").optional().isIn(["ADMIN", "TEACHER", "STUDENT"]),
    body("phone").optional().isMobilePhone("any"),
    body("password").optional().isLength({ min: 6 }),
  ],
  asyncHandler(userController.updateUser),
);

// Toggle user status (Admin only)
router.patch(
  "/:id/status",
  authenticateToken,
  requireAdmin,
  [param("id").isString(), body("isActive").isBoolean()],
  asyncHandler(userController.toggleUserStatus),
);

export default router;
