import { AttendanceRepository } from "../../../../infrastructure/repositories/AttendanceRepository";
import { ClassroomSessionRepository } from "../../../../infrastructure/repositories/ClassroomSessionRepository";
import { IQueryHandler } from "../../../core/IQueryHandler";

export interface GetSessionAttendanceQueryRequest {
  sessionId: string;
  teacherId: string;
}

export class GetSessionAttendanceQueryHandler implements IQueryHandler<GetSessionAttendanceQueryRequest, any> {
  private attendanceRepository: AttendanceRepository;
  private sessionRepository: ClassroomSessionRepository;

  constructor() {
    this.attendanceRepository = new AttendanceRepository();
    this.sessionRepository = new ClassroomSessionRepository();
  }

  async execute(query: GetSessionAttendanceQueryRequest) {
    const { sessionId, teacherId } = query;

    const session = await this.sessionRepository.findFirst({
      where: { id: sessionId, teacherId },
    });

    if (!session) throw new Error("Session not found or access denied");

    const attendances = await this.attendanceRepository.findMany({
      where: { sessionId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { checkinTime: "asc" },
    });

    const sessionDetails = await this.sessionRepository.findUnique({
      where: { id: sessionId },
      include: { classroom: true, course: { select: { title: true } } },
    });

    return { session: sessionDetails, attendances };
  }
}
