import { PrismaClient } from "@prisma/client";
import express from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { sendResponse } from "../utils/response";

const router = express.Router();
const prisma = new PrismaClient();

// GET /classrooms - Get all classrooms
router.get("/", authenticateToken, async (req: any, res) => {
  try {
    const { page = 1, limit = 10, search = "", isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { location: { contains: search } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const [classrooms, total] = await Promise.all([
      prisma.classroom.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          students: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              sessions: true,
              students: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.classroom.count({ where }),
    ]);

    return sendResponse(res, 200, {
      classrooms,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching classrooms:", error);
    return sendResponse(res, 500, null, "Failed to fetch classrooms");
  }
});

// GET /classrooms/:id - Get classroom by ID
router.get("/:id", authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
          },
        },
        sessions: {
          select: {
            id: true,
            courseId: true,
            startTime: true,
            endTime: true,
          },
          orderBy: { startTime: "desc" },
        },
        _count: {
          select: {
            students: true,
            sessions: true,
          },
        },
      },
    });

    if (!classroom) {
      return sendResponse(res, 404, null, "Classroom not found");
    }

    return sendResponse(res, 200, classroom);
  } catch (error) {
    console.error("Error fetching classroom:", error);
    return sendResponse(res, 500, null, "Failed to fetch classroom");
  }
});

// POST /classrooms - Create a new classroom (Admin only)
router.post("/", authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { name, location, capacity } = req.body;

    // Validate required fields
    if (!name) {
      return sendResponse(res, 400, null, "Classroom name is required");
    }

    // Check if classroom name already exists
    const existingClassroom = await prisma.classroom.findFirst({
      where: { name },
    });

    if (existingClassroom) {
      return sendResponse(
        res,
        409,
        null,
        "Classroom with this name already exists"
      );
    }

    const classroom = await prisma.classroom.create({
      data: {
        name,
        location,
        capacity: capacity ? Number(capacity) : null,
      },
      include: {
        _count: {
          select: {
            students: true,
            sessions: true,
          },
        },
      },
    });

    return sendResponse(res, 201, classroom);
  } catch (error) {
    console.error("Error creating classroom:", error);
    return sendResponse(res, 500, null, "Failed to create classroom");
  }
});

// PUT /classrooms/:id - Update classroom (Admin only)
router.put("/:id", authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { name, location, capacity, isActive } = req.body;

    // Check if classroom exists
    const existingClassroom = await prisma.classroom.findUnique({
      where: { id },
    });

    if (!existingClassroom) {
      return sendResponse(res, 404, null, "Classroom not found");
    }

    // Check if new name conflicts with another classroom
    if (name && name !== existingClassroom.name) {
      const nameConflict = await prisma.classroom.findFirst({
        where: {
          name,
          id: { not: id },
        },
      });

      if (nameConflict) {
        return sendResponse(
          res,
          409,
          null,
          "Classroom with this name already exists"
        );
      }
    }

    const classroom = await prisma.classroom.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(location !== undefined && { location }),
        ...(capacity !== undefined && {
          capacity: capacity ? Number(capacity) : null,
        }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            students: true,
            sessions: true,
          },
        },
      },
    });

    return sendResponse(res, 200, classroom);
  } catch (error) {
    console.error("Error updating classroom:", error);
    return sendResponse(res, 500, null, "Failed to update classroom");
  }
});

// DELETE /classrooms/:id - Delete classroom (Admin only)
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: any, res) => {
    try {
      const { id } = req.params;

      // Check if classroom exists and get counts
      const existingClassroom = await prisma.classroom.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              students: true,
              sessions: true,
            },
          },
        },
      });

      if (!existingClassroom) {
        return sendResponse(res, 404, null, "Classroom not found");
      }

      // Check if classroom has students or sessions
      if (existingClassroom._count.students > 0) {
        return sendResponse(
          res,
          400,
          null,
          "Cannot delete classroom with assigned students. Please reassign students first."
        );
      }

      if (existingClassroom._count.sessions > 0) {
        return sendResponse(
          res,
          400,
          null,
          "Cannot delete classroom with existing sessions. Please remove sessions first."
        );
      }

      await prisma.classroom.delete({
        where: { id },
      });

      return sendResponse(res, 200, {
        message: "Classroom deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting classroom:", error);
      return sendResponse(res, 500, null, "Failed to delete classroom");
    }
  }
);

// POST /classrooms/:id/students - Assign students to classroom (Admin only)
router.post(
  "/:id/students",
  authenticateToken,
  requireAdmin,
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const { studentIds } = req.body;

      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return sendResponse(res, 400, null, "Student IDs array is required");
      }

      // Check if classroom exists
      const classroom = await prisma.classroom.findUnique({
        where: { id },
        include: { _count: { select: { students: true } } },
      });

      if (!classroom) {
        return sendResponse(res, 404, null, "Classroom not found");
      }

      // Check capacity limit
      if (
        classroom.capacity &&
        classroom._count.students + studentIds.length > classroom.capacity
      ) {
        return sendResponse(
          res,
          400,
          null,
          `Classroom capacity exceeded. Current: ${classroom._count.students}, Adding: ${studentIds.length}, Capacity: ${classroom.capacity}`
        );
      }

      // Verify all student IDs exist and are students
      const students = await prisma.user.findMany({
        where: {
          id: { in: studentIds },
          role: "STUDENT",
          isActive: true,
        },
      });

      if (students.length !== studentIds.length) {
        return sendResponse(
          res,
          400,
          null,
          "Some student IDs are invalid or not active students"
        );
      }

      // Check for students already assigned to other classrooms
      const alreadyAssigned = students.filter((student) => student.classroomId);
      if (alreadyAssigned.length > 0) {
        return sendResponse(
          res,
          400,
          null,
          `Some students are already assigned to other classrooms: ${alreadyAssigned
            .map((s) => s.firstName + " " + s.lastName)
            .join(", ")}`
        );
      }

      // Assign students to classroom
      await prisma.user.updateMany({
        where: { id: { in: studentIds } },
        data: { classroomId: id },
      });

      // Fetch updated classroom with students
      const updatedClassroom = await prisma.classroom.findUnique({
        where: { id },
        include: {
          students: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              students: true,
              sessions: true,
            },
          },
        },
      });

      return sendResponse(res, 200, updatedClassroom);
    } catch (error) {
      console.error("Error assigning students to classroom:", error);
      return sendResponse(
        res,
        500,
        null,
        "Failed to assign students to classroom"
      );
    }
  }
);

// DELETE /classrooms/:id/students/:studentId - Remove student from classroom (Admin only)
router.delete(
  "/:id/students/:studentId",
  authenticateToken,
  requireAdmin,
  async (req: any, res) => {
    try {
      const { id, studentId } = req.params;

      // Check if classroom exists
      const classroom = await prisma.classroom.findUnique({
        where: { id },
      });

      if (!classroom) {
        return sendResponse(res, 404, null, "Classroom not found");
      }

      // Check if student exists and is assigned to this classroom
      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          classroomId: id,
          role: "STUDENT",
        },
      });

      if (!student) {
        return sendResponse(
          res,
          404,
          null,
          "Student not found in this classroom"
        );
      }

      // Remove student from classroom
      await prisma.user.update({
        where: { id: studentId },
        data: { classroomId: null },
      });

      return sendResponse(res, 200, {
        message: "Student removed from classroom successfully",
      });
    } catch (error) {
      console.error("Error removing student from classroom:", error);
      return sendResponse(
        res,
        500,
        null,
        "Failed to remove student from classroom"
      );
    }
  }
);

// GET /classrooms/:id/available-students - Get students not assigned to any classroom (Admin only)
router.get(
  "/:id/available-students",
  authenticateToken,
  requireAdmin,
  async (req: any, res) => {
    try {
      const { search = "" } = req.query;

      const where: any = {
        role: "STUDENT",
        isActive: true,
        classroomId: null,
      };

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

      const students = await prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      });

      return sendResponse(res, 200, students);
    } catch (error) {
      console.error("Error fetching available students:", error);
      return sendResponse(res, 500, null, "Failed to fetch available students");
    }
  }
);

export default router;
