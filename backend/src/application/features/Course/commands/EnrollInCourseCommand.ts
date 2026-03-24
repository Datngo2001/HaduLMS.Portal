import { CourseRepository } from "../../../../infrastructure/repositories/CourseRepository";
import { EnrollmentRepository } from "../../../../infrastructure/repositories/EnrollmentRepository";
import { prisma } from "../../../../prismaClient";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface EnrollInCourseCommandRequest {
  userId: string;
  courseId: string;
}

export class EnrollInCourseCommandHandler implements ICommandHandler<EnrollInCourseCommandRequest, any> {
  private courseRepository: CourseRepository;
  private enrollmentRepository: EnrollmentRepository;

  constructor() {
    this.courseRepository = new CourseRepository();
    this.enrollmentRepository = new EnrollmentRepository();
  }

  async execute(command: EnrollInCourseCommandRequest) {
    const { userId, courseId } = command;

    const courses = await this.courseRepository.findMany({
      where: { id: courseId, isPublished: true },
    });
    const course = courses[0];

    if (!course) {
      throw new Error("Course not found or not available");
    }

    const existingEnrollments = await this.enrollmentRepository.findMany({
      where: { userId, courseId },
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
          select: { id: true, title: true, description: true },
        },
      },
    });
  }
}
