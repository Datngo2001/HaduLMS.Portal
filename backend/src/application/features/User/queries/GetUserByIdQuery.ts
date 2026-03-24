import { UserRepository } from "../../../../infrastructure/repositories/UserRepository";
import { IQueryHandler } from "../../../core/IQueryHandler";

export interface GetUserByIdQueryRequest {
  id: string;
}

export class GetUserByIdQueryHandler implements IQueryHandler<GetUserByIdQueryRequest, any> {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(query: GetUserByIdQueryRequest) {
    const { id } = query;
    const user = await this.userRepository.findMany({
      where: { id },
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
        updatedAt: true,
        _count: {
          select: { createdCourses: true, enrollments: true },
        },
      },
    });

    if (!user || user.length === 0) {
      throw new Error("User not found");
    }

    return user[0];
  }
}
