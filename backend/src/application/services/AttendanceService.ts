import { AttendanceRepository } from "../../infrastructure/repositories/AttendanceRepository";
import { ClassroomSessionRepository } from "../../infrastructure/repositories/ClassroomSessionRepository";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { ClassroomRepository } from "../../infrastructure/repositories/ClassroomRepository";
import { FaceRecognitionFactory } from "../../services/faceRecognitionFactory";
import { prisma } from "../../prismaClient";

export class AttendanceService {
  private attendanceRepository: AttendanceRepository;
  private sessionRepository: ClassroomSessionRepository;
  private userRepository: UserRepository;
  private classroomRepository: ClassroomRepository;
  private faceService = FaceRecognitionFactory.getService();

  constructor() {
    this.attendanceRepository = new AttendanceRepository();
    this.sessionRepository = new ClassroomSessionRepository();
    this.userRepository = new UserRepository();
    this.classroomRepository = new ClassroomRepository();
  }

  async registerStudentFace(studentId: string, image: string, teacherId: string) {
    if (!this.faceService.isValidImageFormat(image)) {
      throw new Error("Invalid image format. Please provide a valid base64 image.");
    }

    const student = await this.userRepository.findUnique({
      where: { id: studentId },
    });

    if (!student || student.role !== "STUDENT" || !student.isActive) {
      throw new Error("Student not found or is not active");
    }

    const hadExistingFace = student.hasFaceRegistered;
    if (hadExistingFace) {
      try {
        await this.faceService.deleteUserFace(studentId);
      } catch (error) {
        console.warn("Failed to delete existing face, continuing with registration:", error);
      }
    }

    const personId = await this.faceService.registerUserFace(studentId, image);

    await this.userRepository.update({
      where: { id: studentId },
      data: { hasFaceRegistered: true, faceRegisteredAt: new Date() } as any,
    });

    return { personId, hadExistingFace, student };
  }

  async teacherCheckin(teacherId: string, image: string) {
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
    const currentSession = await this.sessionRepository.findFirst({
      where: {
        isActive: true,
        startTime: { lte: now },
        endTime: { gte: now },
      },
    }); // Needs include but using prisma directly might be simpler here due to ordering in original code.
    
    // original code had orderBy: { startTime: "asc" } on session
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

  async getSessionAttendance(sessionId: string, teacherId: string) {
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

  async updateSessionStatus(sessionId: string, teacherId: string, isActive: boolean) {
    const session = await this.sessionRepository.findFirst({
      where: { id: sessionId, teacherId },
    });

    if (!session) throw new Error("Session not found or access denied");

    return await this.sessionRepository.update({
      where: { id: sessionId },
      data: { isActive },
    });
  }

  async getClassroomAttendanceOverview(classroomId: string) {
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
