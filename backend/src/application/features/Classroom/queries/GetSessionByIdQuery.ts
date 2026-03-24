import { ClassroomSessionRepository } from "../../../../infrastructure/repositories/ClassroomSessionRepository";
import { IQueryHandler } from "../../../core/IQueryHandler";

export interface GetSessionByIdQueryRequest {
  classroomId: string;
  sessionId: string;
}

export class GetSessionByIdQueryHandler implements IQueryHandler<GetSessionByIdQueryRequest, any> {
  private sessionRepository: ClassroomSessionRepository;

  constructor() {
    this.sessionRepository = new ClassroomSessionRepository();
  }

  async execute(query: GetSessionByIdQueryRequest) {
    const { classroomId, sessionId } = query;

    const session = await this.sessionRepository.findFirst({
      where: { id: sessionId, classroomId },
      include: {
        course: { select: { id: true, title: true, description: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        classroom: { select: { id: true, name: true, location: true } },
        attendances: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { checkinTime: "desc" },
        },
        _count: { select: { attendances: true } },
      },
    });

    if (!session) throw new Error("Session not found in this classroom");
    return session;
  }
}
