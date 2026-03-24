import { AttendanceRepository } from "../../../../infrastructure/repositories/AttendanceRepository";
import { ClassroomSessionRepository } from "../../../../infrastructure/repositories/ClassroomSessionRepository";
import { UserRepository } from "../../../../infrastructure/repositories/UserRepository";
import { FaceRecognitionFactory } from "../../../../services/faceRecognitionFactory";
import { prisma } from "../../../../prismaClient";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface TeacherCheckinCommandRequest {
  teacherId: string;
  image: string;
}

export class TeacherCheckinCommandHandler implements ICommandHandler<TeacherCheckinCommandRequest, any> {
  private attendanceRepository: AttendanceRepository;
  private sessionRepository: ClassroomSessionRepository;
  private userRepository: UserRepository;
  private faceService = FaceRecognitionFactory.getService();

  constructor() {
    this.attendanceRepository = new AttendanceRepository();
    this.sessionRepository = new ClassroomSessionRepository();
    this.userRepository = new UserRepository();
  }

  async execute(command: TeacherCheckinCommandRequest) {
    const { teacherId, image } = command;

    if (!this.faceService.isValidImageFormat(image)) {
      throw new Error("Invalid image format");
    }

    const identificationResult = await this.faceService.identifyFace(image);
    if (!identificationResult) {
      throw new Error("Face not recognized. Please ensure the student has registered their face.");
    }

    const studentId = identificationResult.userId;
    const student = await this.userRepository.findUnique({
      where: { id: studentId },
    });

    if (!student || student.role !== "STUDENT" || !student.isActive) {
      throw new Error("Student not found or is not active");
    }

    const now = new Date();
    
    const activeSession = await prisma.classroomSession.findFirst({
        where: {
          isActive: true,
          startTime: { lte: now },
          endTime: { gte: now },
        },
        include: {
          classroom: true,
          course: { select: { title: true } },
          teacher: { select: { firstName: true, lastName: true } },
        },
        orderBy: { startTime: "asc" },
      });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await this.attendanceRepository.findFirst({
      where: {
        userId: studentId,
        checkinTime: { gte: today, lt: tomorrow },
        ...(activeSession && { sessionId: activeSession.id }),
      },
    });

    if (existingAttendance) {
      throw new Error(`${student.firstName} ${student.lastName} has already checked in ${activeSession ? "for this session" : "today"}`);
    }

    let status = "PRESENT";
    let sessionId = null;
    let sessionInfo: any = { title: "General Check-in", classroom: { name: "General" } };

    if (activeSession) {
      sessionId = activeSession.id;
      const sessionStart = new Date(activeSession.startTime);
      const lateThreshold = 15;

      if (now.getTime() - sessionStart.getTime() > lateThreshold * 60 * 1000) {
        status = "LATE";
      }

      sessionInfo = {
        title: activeSession.title,
        classroom: { name: activeSession.classroom.name },
      };
    }

    const attendance = await this.attendanceRepository.create({
      data: {
        userId: studentId,
        sessionId,
        status,
        checkinTime: new Date(),
        checkinMethod: "TEACHER_ASSISTED",
        confidence: identificationResult.confidence,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        session: activeSession ? { select: { title: true, classroom: { select: { name: true } } } } : undefined as any,
      },
    });

    return { attendance, student, session: (attendance as any).session || sessionInfo, currentSession: activeSession };
  }
}
