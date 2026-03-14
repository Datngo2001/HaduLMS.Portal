import express from "express";
import { param } from "express-validator";
import {
  authenticateToken,
  requireTeacher,
} from "../middleware/auth";
import { LessonController } from "../presentation/controllers/LessonController";
import { asyncHandler } from "../utils/response";

const router = express.Router();
const lessonController = new LessonController();

// Get lessons for a course
router.get(
  "/course/:courseId",
  [param("courseId").isString()],
  asyncHandler(lessonController.getLessonsByCourseId),
);

// Get lesson by ID
router.get(
  "/:id",
  [param("id").isString()],
  asyncHandler(lessonController.getLessonById),
);

// Create lesson (Teachers and Admins only)
router.post(
  "/",
  authenticateToken,
  requireTeacher,
  asyncHandler(lessonController.createLesson),
);

// Update lesson (Teachers and Admins only)
router.put(
  "/:id",
  authenticateToken,
  requireTeacher,
  [param("id").isString()],
  asyncHandler(lessonController.updateLesson),
);

// Delete lesson (Teachers and Admins only)
router.delete(
  "/:id",
  authenticateToken,
  requireTeacher,
  [param("id").isString()],
  asyncHandler(lessonController.deleteLesson),
);

export default router;
