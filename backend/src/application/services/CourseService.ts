import { CourseRepository } from "../../infrastructure/repositories/CourseRepository";
import { EnrollmentRepository } from "../../infrastructure/repositories/EnrollmentRepository";
import { prisma } from "../../prismaClient"; // used for raw operations if needed, but we will wrap Course

export class CourseService {
  private courseRepository: CourseRepository;
  private enrollmentRepository: EnrollmentRepository;

  constructor() {
    this.courseRepository = new CourseRepository();
    this.enrollmentRepository = new EnrollmentRepository();
  }

  async getPublishedCourses(page: number = 1, limit: number = 10, search: string = "") {
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
      this.courseRepository.findMany({
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
      this.courseRepository.count({ where }),
    ]);

    return {
      courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getCourseById(id: string) {
    const courses = await this.courseRepository.findMany({
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

    const course = courses[0];

    if (!course || !course.isPublished) {
      throw new Error("Course not found");
    }

    return course;
  }

  async createCourse(userId: string, data: { title: string; description?: string; price?: number }) {
    if (!data.title) {
      throw new Error("Title is required");
    }

    // Notice we use prisma here directly since we didn't add create to CourseRepository yet. Let's use prisma directly for simplicity or we can add it to the repo later
    return await prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price ? parseFloat(data.price.toString()) : 0,
        creatorId: userId,
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
  }

  async updateCourse(userId: string, userRole: string, courseId: string, data: any) {
    const existingCourses = await this.courseRepository.findMany({
      where: { id: courseId },
    });
    
    const existingCourse = existingCourses[0];

    if (!existingCourse) {
      throw new Error("Course not found");
    }

    if (existingCourse.creatorId !== userId && userRole !== "ADMIN") {
      throw new Error("Not authorized to update this course");
    }

    return await prisma.course.update({
      where: { id: courseId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: parseFloat(data.price) }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
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
  }

  async enrollInCourse(userId: string, courseId: string) {
    const courses = await this.courseRepository.findMany({
      where: { id: courseId, isPublished: true },
    });
    const course = courses[0];

    if (!course) {
      throw new Error("Course not found or not available");
    }

    const existingEnrollments = await this.enrollmentRepository.findMany({
      where: {
        userId,
        courseId,
      },
    });

    if (existingEnrollments.length > 0) {
      throw new Error("Already enrolled in this course");
    }

    return await prisma.enrollment.create({
      data: {
        userId,
        courseId,
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
  }
}
