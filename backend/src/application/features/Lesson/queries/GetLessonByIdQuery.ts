import { LessonRepository } from "../../../../infrastructure/repositories/LessonRepository";
import { IQueryHandler } from "../../../core/IQueryHandler";

export interface GetLessonByIdQueryRequest {
  id: string;
}

export class GetLessonByIdQueryHandler implements IQueryHandler<GetLessonByIdQueryRequest, any> {
  private lessonRepository: LessonRepository;

  constructor() {
    this.lessonRepository = new LessonRepository();
  }

  async execute(query: GetLessonByIdQueryRequest) {
    const { id } = query;

    const lesson = await this.lessonRepository.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, title: true },
        },
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!lesson || !lesson.isPublished) {
      throw new Error("Lesson not found");
    }

    return lesson;
  }
}
