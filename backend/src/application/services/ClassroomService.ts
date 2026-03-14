import { ClassroomRepository } from "../../infrastructure/repositories/ClassroomRepository";
import { ClassroomSessionRepository } from "../../infrastructure/repositories/ClassroomSessionRepository";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { prisma } from "../../prismaClient";

export class ClassroomService {
  private classroomRepository: ClassroomRepository;
  private sessionRepository: ClassroomSessionRepository;
  private userRepository: UserRepository;

  constructor() {
    this.classroomRepository = new ClassroomRepository();
    this.sessionRepository = new ClassroomSessionRepository();
    this.userRepository = new UserRepository();
  }

  async getClassrooms(page: number = 1, limit: number = 10, search: string = "", isActive?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [classrooms, total] = await Promise.all([
      this.classroomRepository.findMany({
        where,
        skip,
        take: limit,
        include: {
          students: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              sessions: true,
              students: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.classroomRepository.count({ where }),
    ]);

    return {
      classrooms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getClassroomById(id: string) {
    const classroom = await this.classroomRepository.findUnique({
      where: { id },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
          },
        },
        sessions: {
          select: {
            id: true,
            courseId: true,
            startTime: true,
            endTime: true,
          },
          orderBy: { startTime: "desc" },
        },
        _count: {
          select: {
            students: true,
            sessions: true,
          },
        },
      },
    });

    if (!classroom) throw new Error("Classroom not found");
    return classroom;
  }

  async createClassroom(data: { name: string; location?: string; capacity?: number }) {
    if (!data.name) throw new Error("Classroom name is required");

    const existingClassroom = await this.classroomRepository.findFirst({
      where: { name: data.name },
    });

    if (existingClassroom) throw new Error("Classroom with this name already exists");

    return await this.classroomRepository.create({
      data: {
        name: data.name,
        location: data.location,
        capacity: data.capacity,
      },
      include: {
        _count: {
          select: {
            students: true,
            sessions: true,
          },
        },
      },
    });
  }

  async updateClassroom(id: string, data: { name?: string; location?: string; capacity?: number; isActive?: boolean }) {
    const existingClassroom = await this.classroomRepository.findUnique({ where: { id } });
    if (!existingClassroom) throw new Error("Classroom not found");

    if (data.name && data.name !== existingClassroom.name) {
      const nameConflict = await this.classroomRepository.findFirst({
        where: { name: data.name, id: { not: id } },
      });
      if (nameConflict) throw new Error("Classroom with this name already exists");
    }

    return await this.classroomRepository.update({
      where: { id },
      data,
      include: {
        students: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: { students: true, sessions: true },
        },
      },
    });
  }

  async deleteClassroom(id: string) {
    const existingClassroom = await this.classroomRepository.findUnique({
      where: { id },
      include: { _count: { select: { students: true, sessions: true } } },
    });

    if (!existingClassroom) throw new Error("Classroom not found");

    if ((existingClassroom as any)._count.students > 0) {
      throw new Error("Cannot delete classroom with assigned students. Please reassign students first.");
    }

    if ((existingClassroom as any)._count.sessions > 0) {
      throw new Error("Cannot delete classroom with existing sessions. Please remove sessions first.");
    }

    await this.classroomRepository.delete({ where: { id } });
    return true;
  }

  async assignStudents(id: string, studentIds: string[]) {
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      throw new Error("Student IDs array is required");
    }

    const classroom = await this.classroomRepository.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } },
    });

    if (!classroom) throw new Error("Classroom not found");

    if (classroom.capacity && (classroom as any)._count.students + studentIds.length > classroom.capacity) {
      throw new Error(`Classroom capacity exceeded. Current: ${(classroom as any)._count.students}, Adding: ${studentIds.length}, Capacity: ${classroom.capacity}`);
    }

    const students = await this.userRepository.findMany({
      where: { id: { in: studentIds }, role: "STUDENT", isActive: true },
    });

    if (students.length !== studentIds.length) {
      throw new Error("Some student IDs are invalid or not active students");
    }

    const alreadyAssigned = students.filter((s) => s.classroomId);
    if (alreadyAssigned.length > 0) {
      throw new Error(`Some students are already assigned to other classrooms: ${alreadyAssigned.map((s) => s.firstName + " " + s.lastName).join(", ")}`);
    }

    await prisma.user.updateMany({
      where: { id: { in: studentIds } },
      data: { classroomId: id },
    });

    return await this.getClassroomById(id);
  }

  async removeStudent(id: string, studentId: string) {
    const classroom = await this.classroomRepository.findUnique({ where: { id } });
    if (!classroom) throw new Error("Classroom not found");

    const student = await this.userRepository.findUnique({
      where: { id: studentId },
    });

    if (!student || student.classroomId !== id || student.role !== "STUDENT") {
      throw new Error("Student not found in this classroom");
    }

    await this.userRepository.update({
      where: { id: studentId },
      data: { classroomId: null },
    });

    return true;
  }

  async getAvailableStudents(search: string = "") {
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

  async getClassroomSessions(id: string, page: number = 1, limit: number = 10, upcoming?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = { classroomId: id };

    if (upcoming) {
      where.startTime = { gte: new Date() };
    }

    const [sessions, total] = await Promise.all([
      this.sessionRepository.findMany({
        where,
        skip,
        take: limit,
        include: {
          course: { select: { id: true, title: true, description: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { attendances: true } },
        },
        orderBy: { startTime: "desc" },
      }),
      this.sessionRepository.count({ where }),
    ]);

    return {
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSessionById(classroomId: string, sessionId: string) {
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

  async createSession(data: { classroomId: string; title: string; startTime: Date; endTime: Date; teacherId: string; courseId?: string; checkinCode?: string }) {
    if (!data.title || !data.startTime || !data.endTime || !data.teacherId) {
      throw new Error("Title, start time, end time, and teacher are required");
    }

    if (data.startTime >= data.endTime) {
      throw new Error("End time must be after start time");
    }

    const classroom = await this.classroomRepository.findUnique({ where: { id: data.classroomId } });
    if (!classroom) throw new Error("Classroom not found");

    const teacher = await this.userRepository.findUnique({ where: { id: data.teacherId } });
    if (!teacher) throw new Error("Teacher not found");

    const overlappingSessions = await this.sessionRepository.findMany({
      where: {
        classroomId: data.classroomId,
        OR: [
          { AND: [{ startTime: { lte: data.startTime } }, { endTime: { gt: data.startTime } }] },
          { AND: [{ startTime: { lt: data.endTime } }, { endTime: { gte: data.endTime } }] },
          { AND: [{ startTime: { gte: data.startTime } }, { endTime: { lte: data.endTime } }] },
        ],
      },
    });

    if (overlappingSessions.length > 0) {
      throw new Error("Session time conflicts with existing session in this classroom");
    }

    return await this.sessionRepository.create({
      data: {
        title: data.title,
        startTime: data.startTime,
        endTime: data.endTime,
        classroomId: data.classroomId,
        courseId: data.courseId || null,
        teacherId: data.teacherId,
        checkinCode: data.checkinCode || null,
      },
      include: {
        course: { select: { id: true, title: true, description: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { attendances: true } },
      },
    });
  }
}
