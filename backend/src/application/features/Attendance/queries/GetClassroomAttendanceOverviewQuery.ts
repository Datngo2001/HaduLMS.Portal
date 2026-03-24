import { AttendanceRepository } from "../../../../infrastructure/repositories/AttendanceRepository";
import { ClassroomRepository } from "../../../../infrastructure/repositories/ClassroomRepository";
import { ClassroomSessionRepository } from "../../../../infrastructure/repositories/ClassroomSessionRepository";
import { IQueryHandler } from "../../../core/IQueryHandler";

export interface GetClassroomAttendanceOverviewQueryRequest {
  classroomId: string;
}

export class GetClassroomAttendanceOverviewQueryHandler implements IQueryHandler<GetClassroomAttendanceOverviewQueryRequest, any> {
  private attendanceRepository: AttendanceRepository;
  private sessionRepository: ClassroomSessionRepository;
  private classroomRepository: ClassroomRepository;

  constructor() {
    this.attendanceRepository = new AttendanceRepository();
    this.sessionRepository = new ClassroomSessionRepository();
    this.classroomRepository = new ClassroomRepository();
  }

  async execute(query: GetClassroomAttendanceOverviewQueryRequest) {
    const { classroomId } = query;

    const classroom = await this.classroomRepository.findUnique({
      where: { id: classroomId },
      include: { students: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    if (!classroom) throw new Error("Classroom not found");

    const sessions = await this.sessionRepository.findMany({
      where: { classroomId },
      include: {
        classroom: true,
        course: { select: { title: true } },
        teacher: { select: { firstName: true, lastName: true } },
        attendances: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
          orderBy: { checkinTime: "asc" },
        },
      },
      orderBy: { startTime: "desc" },
    });

    const studentIds = (classroom as any).students.map((s: any) => s.id);
    const standaloneAttendances = await this.attendanceRepository.findMany({
      where: { userId: { in: studentIds }, sessionId: null },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { checkinTime: "desc" },
    });

    return { classroom, sessions, standaloneAttendances };
  }
}
