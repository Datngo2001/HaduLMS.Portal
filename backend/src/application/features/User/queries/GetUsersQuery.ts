import { UserRepository } from "../../../../infrastructure/repositories/UserRepository";
import { IQueryHandler } from "../../../core/IQueryHandler";

export interface GetUsersQueryRequest {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class GetUsersQueryHandler implements IQueryHandler<GetUsersQueryRequest, any> {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(query: GetUsersQueryRequest) {
    const { search, role, status } = query;
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.isActive = status === "active";
    }

    const [users, total] = await Promise.all([
      this.userRepository.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          phone: true,
          isActive: true,
          // @ts-ignore
          hasFaceRegistered: true,
          // @ts-ignore
          faceRegisteredAt: true,
          createdAt: true,
          _count: {
            select: { createdCourses: true, enrollments: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.userRepository.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
