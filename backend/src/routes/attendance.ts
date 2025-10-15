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

// Register user face for recognition
router.post(
  "/register-face",
  authenticateToken,
  [body("image").notEmpty().withMessage("Face image is required")],
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { image } = req.body;
    const userId = req.user!.id;

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

      // Check if user already has a face registered
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { faceId: true },
      });

      if (existingUser?.faceId) {
        return sendResponse(
          res,
          400,
          null,
          "Face already registered. Please delete the existing face first."
        );
      }

      const personId = await faceService.registerUserFace(userId, image);

      // Update user with face ID
      await prisma.user.update({
        where: { id: userId },
        data: { faceId: personId },
      });

      return sendResponse(res, 200, {
        message: "Face registered successfully",
        personId,
      });
    } catch (error: any) {
      console.error("Face registration error:", error);
      return sendResponse(
        res,
        500,
        null,
        error.message || "Failed to register face"
      );
    }
  })
);

// Delete user face
router.delete(
  "/register-face",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const userId = req.user!.id;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { faceId: true },
      });

      if (!user?.faceId) {
        return sendResponse(res, 404, null, "No face registration found");
      }

      await faceService.deleteUserFace(user.faceId);

      // Remove face ID from user
      await prisma.user.update({
        where: { id: userId },
        data: { faceId: null },
      });

      return sendResponse(res, 200, {
        message: "Face registration deleted successfully",
      });
    } catch (error: any) {
      console.error("Face deletion error:", error);
      return sendResponse(
        res,
        500,
        null,
        error.message || "Failed to delete face registration"
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

// Face recognition check-in
router.post(
  "/checkin/:sessionId",
  authenticateToken,
  [
    param("sessionId").isString(),
    body("image").notEmpty().withMessage("Face image is required"),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { sessionId } = req.params;
    const { image } = req.body;
    console.log("Session ID:", sessionId);
    // Check if session exists and is active
    const session = await prisma.classroomSession.findUnique({
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

    console.log("Session details:", session);

    if (!session || !session.isActive) {
      return sendResponse(res, 404, null, "Session not found or inactive");
    }

    // Check if session time is valid (within session hours)
    const now = new Date();
    if (now < session.startTime || now > session.endTime) {
      return sendResponse(
        res,
        400,
        null,
        "Check-in is only allowed during session hours"
      );
    }

    // Check if already checked in
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        userId_sessionId: {
          userId: req.user!.id,
          sessionId,
        },
      },
    });

    if (existingAttendance) {
      return sendResponse(
        res,
        400,
        null,
        "Already checked in for this session"
      );
    }

    // Check if user has face registered
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { faceId: true, firstName: true, lastName: true },
    });

    if (!user?.faceId) {
      return sendResponse(
        res,
        400,
        null,
        "Face not registered. Please register your face first."
      );
    }

    try {
      // Validate image format
      if (!faceService.isValidImageFormat(image)) {
        return sendResponse(res, 400, null, "Invalid image format");
      }

      // Identify face
      const identificationResult = await faceService.identifyFace(image);

      if (!identificationResult) {
        return sendResponse(
          res,
          400,
          null,
          "Face not recognized. Please try again or use alternative check-in method."
        );
      }

      if (identificationResult.userId !== req.user!.id) {
        return sendResponse(
          res,
          400,
          null,
          "Face does not match authenticated user"
        );
      }

      // Determine status based on time
      let status = "PRESENT";
      const sessionStart = new Date(session.startTime);
      const checkInTime = new Date();
      const lateThreshold = 15; // 15 minutes late threshold

      if (
        checkInTime.getTime() - sessionStart.getTime() >
        lateThreshold * 60 * 1000
      ) {
        status = "LATE";
      }

      // Create attendance record
      const attendance = await prisma.attendance.create({
        data: {
          userId: req.user!.id,
          sessionId,
          status,
          checkinTime: checkInTime,
          checkinMethod: "FACE_RECOGNITION",
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
          session: {
            select: {
              title: true,
              classroom: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      return sendResponse(res, 201, attendance);
    } catch (error: any) {
      console.error("Face recognition check-in error:", error);
      return sendResponse(res, 500, null, "Check-in failed. Please try again.");
    }
  })
);

// Manual check-in with code (backup method)
router.post(
  "/checkin/:sessionId/manual",
  authenticateToken,
  [
    param("sessionId").isString(),
    body("checkinCode").notEmpty().withMessage("Check-in code is required"),
  ],
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { sessionId } = req.params;
    const { checkinCode } = req.body;

    // Check if session exists and verify code
    const session = await prisma.classroomSession.findUnique({
      where: {
        id: sessionId,
        checkinCode: checkinCode.toUpperCase(),
        isActive: true,
      },
    });

    if (!session) {
      return sendResponse(res, 404, null, "Invalid session or check-in code");
    }

    // Check if already checked in
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        userId_sessionId: {
          userId: req.user!.id,
          sessionId,
        },
      },
    });

    if (existingAttendance) {
      return sendResponse(
        res,
        400,
        null,
        "Already checked in for this session"
      );
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        userId: req.user!.id,
        sessionId,
        status: "PRESENT",
        checkinTime: new Date(),
        checkinMethod: "QR_CODE",
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return sendResponse(res, 201, attendance);
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
