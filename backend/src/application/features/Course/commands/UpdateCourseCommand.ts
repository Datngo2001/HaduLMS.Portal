import { CourseRepository } from "../../../../infrastructure/repositories/CourseRepository";
import { prisma } from "../../../../prismaClient";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface UpdateCourseCommandRequest {
  userId: string;
  userRole: string;
  courseId: string;
  data: any;
}

export class UpdateCourseCommandHandler implements ICommandHandler<UpdateCourseCommandRequest, any> {
  private courseRepository: CourseRepository;

  constructor() {
    this.courseRepository = new CourseRepository();
  }

  async execute(command: UpdateCourseCommandRequest) {
    const { userId, userRole, courseId, data } = command;

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
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }
}
