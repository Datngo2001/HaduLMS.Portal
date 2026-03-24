import { ClassroomRepository } from "../../../../infrastructure/repositories/ClassroomRepository";
import { IQueryHandler } from "../../../core/IQueryHandler";

export interface GetClassroomByIdQueryRequest {
  id: string;
}

export class GetClassroomByIdQueryHandler implements IQueryHandler<GetClassroomByIdQueryRequest, any> {
  private classroomRepository: ClassroomRepository;

  constructor() {
    this.classroomRepository = new ClassroomRepository();
  }

  async execute(query: GetClassroomByIdQueryRequest) {
    const { id } = query;
    const classroom = await this.classroomRepository.findUnique({
      where: { id },
      include: {
        students: {
          select: { id: true, firstName: true, lastName: true, email: true, isActive: true },
        },
        sessions: {
          select: { id: true, courseId: true, startTime: true, endTime: true },
          orderBy: { startTime: "desc" },
        },
        _count: {
          select: { students: true, sessions: true },
        },
      },
    });

    if (!classroom) throw new Error("Classroom not found");
    return classroom;
  }
}
