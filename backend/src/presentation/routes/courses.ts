import express from "express";
import { param, query } from "express-validator";
import {
  authenticateToken,
  requireTeacher,
} from "../middleware/auth";
import { CourseController } from "../controllers/CourseController";
import { asyncHandler } from "../utils/response";

const router = express.Router();
const courseController = new CourseController();

// Get all published courses (public)
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("search").optional().trim(),
  ],
  asyncHandler(courseController.getPublishedCourses),
);

// Get course by ID
router.get(
  "/:id",
  [param("id").isString()],
  asyncHandler(courseController.getCourseById),
);

// Create course (Teachers and Admins only)
router.post(
  "/",
  authenticateToken,
  requireTeacher,
  asyncHandler(courseController.createCourse),
);

// Update course (Teachers and Admins only)
router.put(
  "/:id",
  authenticateToken,
  requireTeacher,
  [param("id").isString()],
  asyncHandler(courseController.updateCourse),
);

// Enroll in course (Students only)
router.post(
  "/:id/enroll",
  authenticateToken,
  [param("id").isString()],
  asyncHandler(courseController.enrollInCourse),
);

export default router;
