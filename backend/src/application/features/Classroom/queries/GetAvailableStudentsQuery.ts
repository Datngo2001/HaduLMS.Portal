import { UserRepository } from "../../../../infrastructure/repositories/UserRepository";
import { IQueryHandler } from "../../../core/IQueryHandler";

export interface GetAvailableStudentsQueryRequest {
  search?: string;
}

export class GetAvailableStudentsQueryHandler implements IQueryHandler<GetAvailableStudentsQueryRequest, any> {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(query: GetAvailableStudentsQueryRequest) {
    const search = query.search || "";
    const where: any = {
      role: "STUDENT",
      isActive: true,
      classroomId: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    return await this.userRepository.findMany({
      where,
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });
  }
}
