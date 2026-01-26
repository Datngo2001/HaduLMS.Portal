import express from "express";
import { param } from "express-validator";
import {
  AuthenticatedRequest,
  authenticateToken,
  requireTeacher,
} from "../middleware/auth";
import { prisma } from "../prismaClient";
import {
  asyncHandler,
  handleValidationErrors,
  sendResponse,
} from "../utils/response";

const router = express.Router();

// Get lessons for a course
router.get(
  "/course/:courseId",
  [param("courseId").isString()],
  asyncHandler(async (req: express.Request, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { courseId } = req.params;

    const lessons = await prisma.lesson.findMany({
      where: {
        courseId,
        isPublished: true,
      },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        content: true,
        videoUrl: true,
        duration: true,
        order: true,
      },
    });

    return sendResponse(res, 200, lessons);
  }),
);

// Get lesson by ID
router.get(
  "/:id",
  [param("id").isString()],
  asyncHandler(async (req: express.Request, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!lesson || !lesson.isPublished) {
      return sendResponse(res, 404, null, "Lesson not found");
    }

    return sendResponse(res, 200, lesson);
  }),
);

// Create lesson (Teachers and Admins only)
router.post(
  "/",
  authenticateToken,
  requireTeacher,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const {
      title,
      content,
      courseId,
      videoUrl,
      duration,
      order = 0,
    } = req.body;

    if (!title || !courseId) {
      return sendResponse(res, 400, null, "Title and courseId are required");
    }

    // Check if course exists and user has permission
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return sendResponse(res, 404, null, "Course not found");
    }

    // Only course creator or admin can add lessons
    if (course.creatorId !== req.user!.id && req.user!.role !== "ADMIN") {
      return sendResponse(
        res,
        403,
        null,
        "Not authorized to add lessons to this course",
      );
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        content,
        courseId,
        videoUrl,
        duration: duration ? parseInt(duration) : null,
        order: parseInt(order),
        creatorId: req.user!.id,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return sendResponse(res, 201, lesson);
  }),
);

// Update lesson (Teachers and Admins only)
router.put(
  "/:id",
  authenticateToken,
  requireTeacher,
  [param("id").isString()],
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    const { title, content, videoUrl, duration, order, isPublished } = req.body;

    // Check if lesson exists and user has permission
    const existingLesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!existingLesson) {
      return sendResponse(res, 404, null, "Lesson not found");
    }

    // Only course creator or admin can update lessons
    if (
      existingLesson.course.creatorId !== req.user!.id &&
      req.user!.role !== "ADMIN"
    ) {
      return sendResponse(
        res,
        403,
        null,
        "Not authorized to update this lesson",
      );
    }

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(duration !== undefined && {
          duration: duration ? parseInt(duration) : null,
        }),
        ...(order !== undefined && { order: parseInt(order) }),
        ...(isPublished !== undefined && { isPublished }),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return sendResponse(res, 200, lesson);
  }),
);

// Delete lesson (Teachers and Admins only)
router.delete(
  "/:id",
  authenticateToken,
  requireTeacher,
  [param("id").isString()],
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;

    // Check if lesson exists and user has permission
    const existingLesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!existingLesson) {
      return sendResponse(res, 404, null, "Lesson not found");
    }

    // Only course creator or admin can delete lessons
    if (
      existingLesson.course.creatorId !== req.user!.id &&
      req.user!.role !== "ADMIN"
    ) {
      return sendResponse(
        res,
        403,
        null,
        "Not authorized to delete this lesson",
      );
    }

    await prisma.lesson.delete({
      where: { id },
    });

    return sendResponse(res, 200, { message: "Lesson deleted successfully" });
  }),
);

export default router;
