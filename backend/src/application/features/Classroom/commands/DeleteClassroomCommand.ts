import { ClassroomRepository } from "../../../../infrastructure/repositories/ClassroomRepository";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface DeleteClassroomCommandRequest {
  id: string;
}

export class DeleteClassroomCommandHandler implements ICommandHandler<DeleteClassroomCommandRequest, any> {
  private classroomRepository: ClassroomRepository;

  constructor() {
    this.classroomRepository = new ClassroomRepository();
  }

  async execute(command: DeleteClassroomCommandRequest) {
    const { id } = command;

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
}
