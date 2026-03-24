import { LessonRepository } from "../../../../infrastructure/repositories/LessonRepository";
import { CourseRepository } from "../../../../infrastructure/repositories/CourseRepository";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface DeleteLessonCommandRequest {
  userId: string;
  userRole: string;
  id: string;
}

export class DeleteLessonCommandHandler implements ICommandHandler<DeleteLessonCommandRequest, any> {
  private lessonRepository: LessonRepository;
  private courseRepository: CourseRepository;

  constructor() {
    this.lessonRepository = new LessonRepository();
    this.courseRepository = new CourseRepository();
  }

  async execute(command: DeleteLessonCommandRequest) {
    const { userId, userRole, id } = command;

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
      throw new Error("Not authorized to delete this lesson");
    }

    await this.lessonRepository.delete({
      where: { id },
    });
    
    return true;
  }
}
