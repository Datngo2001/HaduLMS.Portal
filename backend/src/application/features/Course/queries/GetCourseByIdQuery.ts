import { CourseRepository } from "../../../../infrastructure/repositories/CourseRepository";
import { IQueryHandler } from "../../../core/IQueryHandler";

export interface GetCourseByIdQueryRequest {
  id: string;
}

export class GetCourseByIdQueryHandler implements IQueryHandler<GetCourseByIdQueryRequest, any> {
  private courseRepository: CourseRepository;

  constructor() {
    this.courseRepository = new CourseRepository();
  }

  async execute(query: GetCourseByIdQueryRequest) {
    const { id } = query;

    const courses = await this.courseRepository.findMany({
      where: { id },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
        lessons: {
          where: { isPublished: true },
          orderBy: { order: "asc" },
          select: { id: true, title: true, duration: true, order: true },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    const course = courses[0];

    if (!course || !course.isPublished) {
      throw new Error("Course not found");
    }

    return course;
  }
}
