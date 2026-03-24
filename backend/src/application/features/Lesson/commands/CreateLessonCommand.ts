import { LessonRepository } from "../../../../infrastructure/repositories/LessonRepository";
import { CourseRepository } from "../../../../infrastructure/repositories/CourseRepository";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface CreateLessonCommandRequest {
  userId: string;
  userRole: string;
  data: any;
}

export class CreateLessonCommandHandler implements ICommandHandler<CreateLessonCommandRequest, any> {
  private lessonRepository: LessonRepository;
  private courseRepository: CourseRepository;

  constructor() {
    this.lessonRepository = new LessonRepository();
    this.courseRepository = new CourseRepository();
  }

  async execute(command: CreateLessonCommandRequest) {
    const { userId, userRole, data } = command;

    if (!data.title || !data.courseId) {
      throw new Error("Title and courseId are required");
    }

    const courses = await this.courseRepository.findMany({
      where: { id: data.courseId },
    });
    
    const course = courses[0];

    if (!course) {
      throw new Error("Course not found");
    }

    if (course.creatorId !== userId && userRole !== "ADMIN") {
      throw new Error("Not authorized to add lessons to this course");
    }

    return await this.lessonRepository.create({
      data: {
        title: data.title,
        content: data.content,
        courseId: data.courseId,
        videoUrl: data.videoUrl,
        duration: data.duration ? parseInt(data.duration) : null,
        order: data.order ? parseInt(data.order) : 0,
        creatorId: userId,
      },
      include: {
        course: {
          select: { id: true, title: true },
        },
      },
    });
  }
}
