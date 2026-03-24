import { ClassroomRepository } from "../../../../infrastructure/repositories/ClassroomRepository";
import { UserRepository } from "../../../../infrastructure/repositories/UserRepository";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface RemoveStudentCommandRequest {
  id: string;
  studentId: string;
}

export class RemoveStudentCommandHandler implements ICommandHandler<RemoveStudentCommandRequest, any> {
  private classroomRepository: ClassroomRepository;
  private userRepository: UserRepository;

  constructor() {
    this.classroomRepository = new ClassroomRepository();
    this.userRepository = new UserRepository();
  }

  async execute(command: RemoveStudentCommandRequest) {
    const { id, studentId } = command;

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
}
