import { CourseRepository } from "../../../../infrastructure/repositories/CourseRepository";
import { IQueryHandler } from "../../../core/IQueryHandler";

export interface GetPublishedCoursesQueryRequest {
  page?: number;
  limit?: number;
  search?: string;
}

export class GetPublishedCoursesQueryHandler implements IQueryHandler<GetPublishedCoursesQueryRequest, any> {
  private courseRepository: CourseRepository;

  constructor() {
    this.courseRepository = new CourseRepository();
  }

  async execute(query: GetPublishedCoursesQueryRequest) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const search = query.search || "";

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
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { lessons: true, enrollments: true },
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
}
