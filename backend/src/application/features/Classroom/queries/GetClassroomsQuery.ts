import { ClassroomRepository } from "../../../../infrastructure/repositories/ClassroomRepository";
import { IQueryHandler } from "../../../core/IQueryHandler";

export interface GetClassroomsQueryRequest {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export class GetClassroomsQueryHandler implements IQueryHandler<GetClassroomsQueryRequest, any> {
  private classroomRepository: ClassroomRepository;

  constructor() {
    this.classroomRepository = new ClassroomRepository();
  }

  async execute(query: GetClassroomsQueryRequest) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const search = query.search || "";
    const isActive = query.isActive;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [classrooms, total] = await Promise.all([
      this.classroomRepository.findMany({
        where,
        skip,
        take: limit,
        include: {
          students: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: {
            select: { sessions: true, students: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.classroomRepository.count({ where }),
    ]);

    return {
      classrooms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
