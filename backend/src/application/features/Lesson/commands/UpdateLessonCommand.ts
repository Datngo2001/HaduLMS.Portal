import { LessonRepository } from "../../../../infrastructure/repositories/LessonRepository";
import { CourseRepository } from "../../../../infrastructure/repositories/CourseRepository";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface UpdateLessonCommandRequest {
  userId: string;
  userRole: string;
  id: string;
  data: any;
}

export class UpdateLessonCommandHandler implements ICommandHandler<UpdateLessonCommandRequest, any> {
  private lessonRepository: LessonRepository;
  private courseRepository: CourseRepository;

  constructor() {
    this.lessonRepository = new LessonRepository();
    this.courseRepository = new CourseRepository();
  }

  async execute(command: UpdateLessonCommandRequest) {
    const { userId, userRole, id, data } = command;

    const existingLesson = await this.lessonRepository.findUnique({
      where: { id },
    });

    if (!existingLesson) {
      throw new Error("Lesson not found");
    }
    
    const course = await this.courseRepository.findMany({
      where: { id: existingLesson.courseId },
    });

    if (!course[0] || (course[0].creatorId !== userId && userRole !== "ADMIN")) {
      throw new Error("Not authorized to update this lesson");
    }

    return await this.lessonRepository.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
        ...(data.duration !== undefined && { duration: data.duration ? parseInt(data.duration) : null }),
        ...(data.order !== undefined && { order: parseInt(data.order) }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      },
      include: {
        course: {
          select: { id: true, title: true },
        },
      },
    });
  }
}
