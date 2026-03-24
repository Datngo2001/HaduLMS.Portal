import { LessonRepository } from "../../../../infrastructure/repositories/LessonRepository";
import { IQueryHandler } from "../../../core/IQueryHandler";

export interface GetLessonsByCourseIdQueryRequest {
  courseId: string;
}

export class GetLessonsByCourseIdQueryHandler implements IQueryHandler<GetLessonsByCourseIdQueryRequest, any> {
  private lessonRepository: LessonRepository;

  constructor() {
    this.lessonRepository = new LessonRepository();
  }

  async execute(query: GetLessonsByCourseIdQueryRequest) {
    const { courseId } = query;

    return await this.lessonRepository.findMany({
      where: {
        courseId,
        isPublished: true,
      },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        content: true,
        videoUrl: true,
        duration: true,
        order: true,
      },
    });
  }
}
