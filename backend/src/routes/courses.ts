import express from "express";
import { param, query } from "express-validator";
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

// Get all published courses (public)
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("search").optional().trim(),
  ],
  asyncHandler(async (req: express.Request, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where = {
      isPublished: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              lessons: true,
              enrollments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.course.count({ where }),
    ]);

    return sendResponse(res, 200, {
      courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }),
);

// Get course by ID
router.get(
  "/:id",
  [param("id").isString()],
  asyncHandler(async (req: express.Request, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        lessons: {
          where: { isPublished: true },
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            duration: true,
            order: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      return sendResponse(res, 404, null, "Course not found");
    }

    if (!course.isPublished) {
      return sendResponse(res, 404, null, "Course not found");
    }

    return sendResponse(res, 200, course);
  }),
);

// Create course (Teachers and Admins only)
router.post(
  "/",
  authenticateToken,
  requireTeacher,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { title, description, price = 0 } = req.body;

    if (!title) {
      return sendResponse(res, 400, null, "Title is required");
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        creatorId: req.user!.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return sendResponse(res, 201, course);
  }),
);

// Update course (Teachers and Admins only)
router.put(
  "/:id",
  authenticateToken,
  requireTeacher,
  [param("id").isString()],
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    const { title, description, price, isPublished } = req.body;

    // Check if course exists and user has permission
    const existingCourse = await prisma.course.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      return sendResponse(res, 404, null, "Course not found");
    }

    // Only course creator or admin can update
    if (
      existingCourse.creatorId !== req.user!.id &&
      req.user!.role !== "ADMIN"
    ) {
      return sendResponse(
        res,
        403,
        null,
        "Not authorized to update this course",
      );
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(isPublished !== undefined && { isPublished }),
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return sendResponse(res, 200, course);
  }),
);

// Enroll in course (Students only)
router.post(
  "/:id/enroll",
  authenticateToken,
  [param("id").isString()],
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    const userId = req.user!.id;

    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id, isPublished: true },
    });

    if (!course) {
      return sendResponse(res, 404, null, "Course not found or not available");
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: id,
        },
      },
    });

    if (existingEnrollment) {
      return sendResponse(res, 400, null, "Already enrolled in this course");
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId: id,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });

    return sendResponse(res, 201, enrollment);
  }),
);

export default router;
