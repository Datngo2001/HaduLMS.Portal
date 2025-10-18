import bcrypt from "bcryptjs";
import express from "express";
import { body, param, query } from "express-validator";
import { prisma } from "../index";
import {
  AuthenticatedRequest,
  authenticateToken,
  requireAdmin,
} from "../middleware/auth";
import {
  asyncHandler,
  handleValidationErrors,
  sendResponse,
} from "../utils/response";

const router = express.Router();

// Get current user profile
router.get(
  "/profile",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return sendResponse(res, 404, null, "User not found");
    }

    return sendResponse(res, 200, user);
  })
);

// Get user's enrollments
router.get(
  "/enrollments",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user!.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            creator: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    return sendResponse(res, 200, enrollments);
  })
);

// Get user's created courses (for teachers/admins)
router.get(
  "/courses",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (req.user!.role === "STUDENT") {
      return sendResponse(
        res,
        403,
        null,
        "Students cannot access this endpoint"
      );
    }

    const courses = await prisma.course.findMany({
      where: { creatorId: req.user!.id },
      include: {
        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return sendResponse(res, 200, courses);
  })
);

// Update user profile
router.put(
  "/profile",
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    const { firstName, lastName } = req.body;

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;

    if (Object.keys(updateData).length === 0) {
      return sendResponse(res, 400, null, "No valid fields to update");
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    return sendResponse(res, 200, user);
  })
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
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { search, role, status, page = "1", limit = "10" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.isActive = status === "active";
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          phone: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              createdCourses: true,
              enrollments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.user.count({ where }),
    ]);

    return sendResponse(res, 200, {
      users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  })
);

// Get user by ID (Admin only)
router.get(
  "/:id",
  authenticateToken,
  requireAdmin,
  [param("id").isString()],
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            createdCourses: true,
            enrollments: true,
          },
        },
      },
    });

    if (!user) {
      return sendResponse(res, 404, null, "User not found");
    }

    return sendResponse(res, 200, user);
  })
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
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { email, firstName, lastName, password, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendResponse(
        res,
        400,
        null,
        "User already exists with this email"
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role,
        phone,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return sendResponse(res, 201, user, "User created successfully");
  })
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
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    const { email, firstName, lastName, role, phone, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return sendResponse(res, 404, null, "User not found");
    }

    // If updating email, check if it's already taken
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return sendResponse(
          res,
          400,
          null,
          "Email already taken by another user"
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (email) updateData.email = email;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (role) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return sendResponse(res, 400, null, "No valid fields to update");
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sendResponse(res, 200, user, "User updated successfully");
  })
);

// Toggle user status (Admin only)
router.patch(
  "/:id/status",
  authenticateToken,
  requireAdmin,
  [param("id").isString(), body("isActive").isBoolean()],
  asyncHandler(async (req: AuthenticatedRequest, res: express.Response) => {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    const { isActive } = req.body;

    // Prevent admin from disabling themselves
    if (req.user!.id === id && !isActive) {
      return sendResponse(res, 400, null, "Cannot disable your own account");
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const action = isActive ? "enabled" : "disabled";
    return sendResponse(res, 200, user, `User ${action} successfully`);
  })
);

export default router;
