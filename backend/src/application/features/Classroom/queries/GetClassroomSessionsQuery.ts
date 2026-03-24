import { ClassroomSessionRepository } from "../../../../infrastructure/repositories/ClassroomSessionRepository";
import { IQueryHandler } from "../../../core/IQueryHandler";

export interface GetClassroomSessionsQueryRequest {
  id: string;
  page?: number;
  limit?: number;
  upcoming?: boolean;
}

export class GetClassroomSessionsQueryHandler implements IQueryHandler<GetClassroomSessionsQueryRequest, any> {
  private sessionRepository: ClassroomSessionRepository;

  constructor() {
    this.sessionRepository = new ClassroomSessionRepository();
  }

  async execute(query: GetClassroomSessionsQueryRequest) {
    const { id } = query;
    const page = query.page || 1;
    const limit = query.limit || 10;
    const upcoming = query.upcoming;

    const skip = (page - 1) * limit;
    const where: any = { classroomId: id };

    if (upcoming) {
      where.startTime = { gte: new Date() };
    }

    const [sessions, total] = await Promise.all([
      this.sessionRepository.findMany({
        where,
        skip,
        take: limit,
        include: {
          course: { select: { id: true, title: true, description: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { attendances: true } },
        },
        orderBy: { startTime: "desc" },
      }),
      this.sessionRepository.count({ where }),
    ]);

    return {
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
