import express from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { ClassroomController } from "../controllers/ClassroomController";
import { asyncHandler } from "../utils/response";

const router = express.Router();
const classroomController = new ClassroomController();

// GET /classrooms - Get all classrooms
router.get("/", authenticateToken, asyncHandler(classroomController.getClassrooms));

// GET /classrooms/:id - Get classroom by ID
router.get("/:id", authenticateToken, asyncHandler(classroomController.getClassroomById));

// POST /classrooms - Create a new classroom (Admin only)
router.post("/", authenticateToken, requireAdmin, asyncHandler(classroomController.createClassroom));

// PUT /classrooms/:id - Update classroom (Admin only)
router.put("/:id", authenticateToken, requireAdmin, asyncHandler(classroomController.updateClassroom));

// DELETE /classrooms/:id - Delete classroom (Admin only)
router.delete("/:id", authenticateToken, requireAdmin, asyncHandler(classroomController.deleteClassroom));

// POST /classrooms/:id/students - Assign students to classroom (Admin only)
router.post("/:id/students", authenticateToken, requireAdmin, asyncHandler(classroomController.assignStudents));

// DELETE /classrooms/:id/students/:studentId - Remove student from classroom (Admin only)
router.delete("/:id/students/:studentId", authenticateToken, requireAdmin, asyncHandler(classroomController.removeStudent));

// GET /classrooms/:id/available-students - Get students not assigned to any classroom (Admin only)
router.get("/:id/available-students", authenticateToken, requireAdmin, asyncHandler(classroomController.getAvailableStudents));

// GET /classrooms/:id/sessions - Get classroom sessions
router.get("/:id/sessions", authenticateToken, asyncHandler(classroomController.getClassroomSessions));

// GET /classrooms/:classroomId/sessions/:sessionId - Get specific classroom session
router.get("/:classroomId/sessions/:sessionId", authenticateToken, asyncHandler(classroomController.getSessionById));

// POST /classrooms/:id/sessions - Create a new classroom session
router.post("/:id/sessions", authenticateToken, requireAdmin, asyncHandler(classroomController.createSession));

// PUT /classrooms/:classroomId/sessions/:sessionId - Update a classroom session
router.put("/:classroomId/sessions/:sessionId", authenticateToken, requireAdmin, asyncHandler(classroomController.updateSession));

export default router;
