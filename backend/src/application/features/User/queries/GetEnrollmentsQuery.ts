import { EnrollmentRepository } from "../../../../infrastructure/repositories/EnrollmentRepository";
import { IQueryHandler } from "../../../core/IQueryHandler";

export interface GetEnrollmentsQueryRequest {
  userId: string;
}

export class GetEnrollmentsQueryHandler implements IQueryHandler<GetEnrollmentsQueryRequest, any> {
  private enrollmentRepository: EnrollmentRepository;

  constructor() {
    this.enrollmentRepository = new EnrollmentRepository();
  }

  async execute(query: GetEnrollmentsQueryRequest) {
    const { userId } = query;
    return await this.enrollmentRepository.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            creator: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });
  }
}
