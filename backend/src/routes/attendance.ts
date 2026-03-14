import express from "express";
import { body, param } from "express-validator";
import { authenticateToken, requireTeacher } from "../middleware/auth";
import { AttendanceController } from "../presentation/controllers/AttendanceController";
import { asyncHandler } from "../utils/response";

const router = express.Router();
const attendanceController = new AttendanceController();

// Register face for student (teacher only)
router.post(
  "/register-student-face",
  authenticateToken,
  requireTeacher,
  [
    body("studentId").notEmpty().withMessage("Student ID is required"),
    body("image").notEmpty().withMessage("Face image is required"),
  ],
  asyncHandler(attendanceController.registerStudentFace),
);

// Create classroom
router.post(
  "/classrooms",
  authenticateToken,
  requireTeacher,
  [
    body("name").notEmpty().withMessage("Classroom name is required"),
    body("location").optional().isString(),
    body("capacity").optional().isInt({ min: 1 }),
  ],
  asyncHandler(attendanceController.createClassroom),
);

// Get all classrooms
router.get(
  "/classrooms",
  authenticateToken,
  requireTeacher,
  asyncHandler(attendanceController.getAllClassrooms),
);

// Create classroom session
router.post(
  "/sessions",
  authenticateToken,
  requireTeacher,
  [
    body("title").notEmpty().withMessage("Session title is required"),
    body("classroomId").notEmpty().withMessage("Classroom ID is required"),
    body("startTime").isISO8601().withMessage("Valid start time is required"),
    body("endTime").isISO8601().withMessage("Valid end time is required"),
    body("courseId").optional().isString(),
  ],
  asyncHandler(attendanceController.createSession),
);

// Get session details
router.get(
  "/sessions/:sessionId",
  authenticateToken,
  [param("sessionId").isString()],
  asyncHandler(attendanceController.getSessionById),
);

// Get teacher's sessions
router.get(
  "/sessions",
  authenticateToken,
  requireTeacher,
  asyncHandler(attendanceController.getTeacherSessions),
);

// Teacher assisted check-in (teacher checks in students using face recognition)
router.post(
  "/teacher-checkin",
  authenticateToken,
  requireTeacher,
  [body("image").notEmpty().withMessage("Face image is required")],
  asyncHandler(attendanceController.teacherCheckin),
);

// Get session attendance (for teachers)
router.get(
  "/sessions/:sessionId/attendance",
  authenticateToken,
  requireTeacher,
  [param("sessionId").isString()],
  asyncHandler(attendanceController.getSessionAttendance),
);

// Update session status
router.patch(
  "/sessions/:sessionId",
  authenticateToken,
  requireTeacher,
  [param("sessionId").isString(), body("isActive").isBoolean()],
  asyncHandler(attendanceController.updateSessionStatus),
);

// Get classroom attendance overview (for teachers)
router.get(
  "/classrooms/:classroomId/attendance",
  authenticateToken,
  requireTeacher,
  [param("classroomId").isString()],
  asyncHandler(attendanceController.getClassroomAttendanceOverview),
);

export default router;
