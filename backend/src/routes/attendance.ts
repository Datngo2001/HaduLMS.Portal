import express from "express";
import { body, param } from "express-validator";
import { prisma } from "../index";
import {
  AuthenticatedRequest,
  authenticateToken,
  requireTeacher,
} from "../middleware/auth";
import { FaceRecognitionFactory } from "../services/faceRecognitionFactory";
import {
  asyncHandler,
  handleValidationErrors,
  sendResponse,
} from "../utils/response";

const router = express.Router();
const faceService = FaceRecognitionFactory.getService();

// Register face for student (teacher only)
router.post(
  "/register-student-face",
  authenticateToken,
  requireTeacher,
  [
    body("studentId").notEmpty().withMessage("Student ID is required"),
    body("image").notEmpty().withMessage("Face image is required"),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { studentId, image } = req.body;
    const teacherId = req.user!.id;

    try {
      // Validate image format
      if (!faceService.isValidImageFormat(image)) {
        return sendResponse(
          res,
          400,
          null,
          "Invalid image format. Please provide a valid base64 image."
        );
      }

      // Check if student exists and is active
      const student = await prisma.user.findUnique({
        where: {
          id: studentId,
          role: "STUDENT",
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          faceId: true,
        },
      });

      if (!student) {
        return sendResponse(
          res,
          404,
          null,
          "Student not found or is not active"
        );
      }

      // Check if student already has a face registered
      const hadExistingFace = !!student.faceId;
      if (student.faceId) {
        try {
          // Delete the existing face registration
          await faceService.deleteUserFace(student.faceId);
          console.log(
            `Deleted existing face registration for student ${studentId}`
          );
        } catch (error) {
          console.warn(
            "Failed to delete existing face, continuing with registration:",
            error
          );
          // Continue with registration even if deletion fails
        }
      }

      const personId = await faceService.registerUserFace(studentId, image);

      // Update student with face ID
      await prisma.user.update({
        where: { id: studentId },
        data: { faceId: personId },
      });

      return sendResponse(res, 200, {
        message: hadExistingFace
          ? "Student face registration updated successfully"
          : "Student face registered successfully",
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
        },
        personId,
      });
    } catch (error: any) {
      console.error("Student face registration error:", error);
      return sendResponse(
        res,
        500,
        null,
        error.message || "Failed to register student face"
      );
    }
  })
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
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { name, location, capacity } = req.body;

    const classroom = await prisma.classroom.create({
      data: {
        name,
        location,
        capacity: capacity ? parseInt(capacity) : undefined,
      },
    });

    return sendResponse(res, 201, classroom);
  })
);

// Get all classrooms
router.get(
  "/classrooms",
  authenticateToken,
  requireTeacher,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const classrooms = await prisma.classroom.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return sendResponse(res, 200, classrooms);
  })
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
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { title, classroomId, courseId, startTime, endTime } = req.body;

    // Validate that classroom exists
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
    });

    if (!classroom) {
      return sendResponse(res, 404, null, "Classroom not found");
    }

    // Validate course if provided
    if (courseId) {
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          creatorId: req.user!.id,
        },
      });

      if (!course) {
        return sendResponse(
          res,
          404,
          null,
          "Course not found or you do not have permission"
        );
      }
    }

    // Generate unique check-in code
    const checkinCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    const session = await prisma.classroomSession.create({
      data: {
        title,
        classroomId,
        courseId,
        teacherId: req.user!.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isActive: true,
        checkinCode,
      },
      include: {
        classroom: true,
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return sendResponse(res, 201, session);
  })
);

// Get session details
router.get(
  "/sessions/:sessionId",
  authenticateToken,
  [param("sessionId").isString()],
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { sessionId } = req.params;

    const session = await prisma.classroomSession.findUnique({
      where: { id: sessionId },
      include: {
        classroom: true,
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!session) {
      return sendResponse(res, 404, null, "Session not found");
    }

    return sendResponse(res, 200, session);
  })
);

// Get teacher's sessions
router.get(
  "/sessions",
  authenticateToken,
  requireTeacher,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const sessions = await prisma.classroomSession.findMany({
      where: { teacherId: req.user!.id },
      include: {
        classroom: true,
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            attendances: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
    });

    return sendResponse(res, 200, sessions);
  })
);

// Teacher assisted check-in (teacher checks in students using face recognition)
router.post(
  "/teacher-checkin",
  authenticateToken,
  requireTeacher,
  [body("image").notEmpty().withMessage("Face image is required")],
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { image } = req.body;
    const teacherId = req.user!.id;
    const now = new Date();

    try {
      // Validate image format
      if (!faceService.isValidImageFormat(image)) {
        return sendResponse(res, 400, null, "Invalid image format");
      }

      // Identify the face to determine which student is being checked in
      const identificationResult = await faceService.identifyFace(image);

      if (!identificationResult) {
        return sendResponse(
          res,
          400,
          null,
          "Face not recognized. Please ensure the student has registered their face."
        );
      }

      const studentId = identificationResult.userId;

      // Get student information
      const student = await prisma.user.findUnique({
        where: {
          id: studentId,
          role: "STUDENT",
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          classroomId: true,
        },
      });

      if (!student) {
        return sendResponse(
          res,
          404,
          null,
          "Student not found or is not active"
        );
      }

      // Try to find any current active session (not necessarily from this teacher)
      const currentSession = await prisma.classroomSession.findFirst({
        where: {
          isActive: true,
          startTime: { lte: now },
          endTime: { gte: now },
        },
        include: {
          classroom: true,
          course: {
            select: {
              title: true,
            },
          },
          teacher: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { startTime: "asc" }, // Get the earliest active session
      });

      // Check if student has already checked in today (prevent duplicate check-ins)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          userId: studentId,
          checkinTime: {
            gte: today,
            lt: tomorrow,
          },
          // If there's a session, check for that specific session
          // If no session, check for any attendance today
          ...(currentSession && { sessionId: currentSession.id }),
        },
      });

      if (existingAttendance) {
        return sendResponse(
          res,
          400,
          {
            student: {
              id: student.id,
              firstName: student.firstName,
              lastName: student.lastName,
            },
            existingAttendance: {
              checkinTime: existingAttendance.checkinTime,
              status: existingAttendance.status,
              checkinMethod: existingAttendance.checkinMethod,
            },
          },
          `${student.firstName} ${student.lastName} has already checked in ${
            currentSession ? "for this session" : "today"
          }`
        );
      }

      // Determine status and session info
      let status = "PRESENT";
      let sessionId = null;
      let sessionInfo = null;

      if (currentSession) {
        sessionId = currentSession.id;
        const sessionStart = new Date(currentSession.startTime);
        const checkInTime = new Date();
        const lateThreshold = 15; // 15 minutes late threshold

        if (
          checkInTime.getTime() - sessionStart.getTime() >
          lateThreshold * 60 * 1000
        ) {
          status = "LATE";
        }

        sessionInfo = {
          title: currentSession.title,
          classroom: {
            name: currentSession.classroom.name,
          },
        };
      } else {
        // No active session - create standalone check-in
        sessionInfo = {
          title: "General Check-in",
          classroom: {
            name: "General",
          },
        };
      }

      // Create attendance record
      const attendance = await prisma.attendance.create({
        data: {
          userId: studentId,
          sessionId, // Can be null for standalone check-ins
          status,
          checkinTime: new Date(),
          checkinMethod: "TEACHER_ASSISTED",
          confidence: identificationResult.confidence,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          session: currentSession
            ? {
                select: {
                  title: true,
                  classroom: {
                    select: {
                      name: true,
                    },
                  },
                },
              }
            : undefined,
        },
      });

      // Add session info for response if it's a standalone check-in
      const responseData = {
        ...attendance,
        session: attendance.session || sessionInfo,
        message: `Successfully checked in ${student.firstName} ${
          student.lastName
        }${currentSession ? ` to ${currentSession.title}` : ""}`,
      };

      return sendResponse(res, 201, responseData);
    } catch (error: any) {
      console.error("Teacher assisted check-in error:", error);
      return sendResponse(res, 500, null, "Check-in failed. Please try again.");
    }
  })
);

// Get session attendance (for teachers)
router.get(
  "/sessions/:sessionId/attendance",
  authenticateToken,
  requireTeacher,
  [param("sessionId").isString()],
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { sessionId } = req.params;

    // Verify teacher owns this session
    const session = await prisma.classroomSession.findFirst({
      where: {
        id: sessionId,
        teacherId: req.user!.id,
      },
    });

    if (!session) {
      return sendResponse(res, 404, null, "Session not found or access denied");
    }

    const attendances = await prisma.attendance.findMany({
      where: { sessionId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { checkinTime: "asc" },
    });

    const sessionDetails = await prisma.classroomSession.findUnique({
      where: { id: sessionId },
      include: {
        classroom: true,
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    return sendResponse(res, 200, {
      session: sessionDetails,
      attendances,
      summary: {
        total: attendances.length,
        present: attendances.filter((a: any) => a.status === "PRESENT").length,
        late: attendances.filter((a: any) => a.status === "LATE").length,
        faceRecognition: attendances.filter(
          (a: any) => a.checkinMethod === "FACE_RECOGNITION"
        ).length,
        manual: attendances.filter((a: any) => a.checkinMethod === "QR_CODE")
          .length,
      },
    });
  })
);

// Update session status
router.patch(
  "/sessions/:sessionId",
  authenticateToken,
  requireTeacher,
  [param("sessionId").isString(), body("isActive").isBoolean()],
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { sessionId } = req.params;
    const { isActive } = req.body;

    const session = await prisma.classroomSession.findFirst({
      where: {
        id: sessionId,
        teacherId: req.user!.id,
      },
    });

    if (!session) {
      return sendResponse(res, 404, null, "Session not found or access denied");
    }

    const updatedSession = await prisma.classroomSession.update({
      where: { id: sessionId },
      data: { isActive },
    });

    return sendResponse(res, 200, updatedSession);
  })
);

export default router;
