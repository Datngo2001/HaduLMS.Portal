import { CourseRepository } from "../../../../infrastructure/repositories/CourseRepository";
import { IQueryHandler } from "../../../core/IQueryHandler";

export interface GetCreatedCoursesQueryRequest {
  userId: string;
}

export class GetCreatedCoursesQueryHandler implements IQueryHandler<GetCreatedCoursesQueryRequest, any> {
  private courseRepository: CourseRepository;

  constructor() {
    this.courseRepository = new CourseRepository();
  }

  async execute(query: GetCreatedCoursesQueryRequest) {
    const { userId } = query;
    return await this.courseRepository.findMany({
      where: { creatorId: userId },
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
  }
}
