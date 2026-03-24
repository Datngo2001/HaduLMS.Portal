import { ClassroomRepository } from "../../../../infrastructure/repositories/ClassroomRepository";
import { UserRepository } from "../../../../infrastructure/repositories/UserRepository";
import { prisma } from "../../../../infrastructure/prismaClient";
import { ICommandHandler } from "../../../core/ICommandHandler";
import { GetClassroomByIdQueryHandler } from "../queries/GetClassroomByIdQuery";

export interface AssignStudentsCommandRequest {
  id: string;
  studentIds: string[];
}

export class AssignStudentsCommandHandler implements ICommandHandler<AssignStudentsCommandRequest, any> {
  private classroomRepository: ClassroomRepository;
  private userRepository: UserRepository;

  constructor() {
    this.classroomRepository = new ClassroomRepository();
    this.userRepository = new UserRepository();
  }

  async execute(command: AssignStudentsCommandRequest) {
    const { id, studentIds } = command;

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

    const getQueryHandler = new GetClassroomByIdQueryHandler();
    return await getQueryHandler.execute({ id });
  }
}
