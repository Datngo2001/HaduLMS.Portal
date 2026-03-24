import { ClassroomRepository } from "../../../../infrastructure/repositories/ClassroomRepository";
import { ClassroomSessionRepository } from "../../../../infrastructure/repositories/ClassroomSessionRepository";
import { UserRepository } from "../../../../infrastructure/repositories/UserRepository";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface CreateSessionCommandRequest {
  classroomId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  teacherId: string;
  courseId?: string;
  checkinCode?: string;
}

export class CreateSessionCommandHandler implements ICommandHandler<CreateSessionCommandRequest, any> {
  private classroomRepository: ClassroomRepository;
  private sessionRepository: ClassroomSessionRepository;
  private userRepository: UserRepository;

  constructor() {
    this.classroomRepository = new ClassroomRepository();
    this.sessionRepository = new ClassroomSessionRepository();
    this.userRepository = new UserRepository();
  }

  async execute(command: CreateSessionCommandRequest) {
    const { classroomId, title, startTime, endTime, teacherId, courseId, checkinCode } = command;

    if (!title || !startTime || !endTime || !teacherId) {
      throw new Error("Title, start time, end time, and teacher are required");
    }

    if (startTime >= endTime) {
      throw new Error("End time must be after start time");
    }

    const classroom = await this.classroomRepository.findUnique({ where: { id: classroomId } });
    if (!classroom) throw new Error("Classroom not found");

    const teacher = await this.userRepository.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new Error("Teacher not found");

    const overlappingSessions = await this.sessionRepository.findMany({
      where: {
        classroomId,
        OR: [
          { AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }] },
          { AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }] },
          { AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }] },
        ],
      },
    });

    if (overlappingSessions.length > 0) {
      throw new Error("Session time conflicts with existing session in this classroom");
    }

    return await this.sessionRepository.create({
      data: {
        title,
        startTime,
        endTime,
        classroomId,
        courseId: courseId || null,
        teacherId,
        checkinCode: checkinCode || null,
      },
      include: {
        course: { select: { id: true, title: true, description: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { attendances: true } },
      },
    });
  }
}
