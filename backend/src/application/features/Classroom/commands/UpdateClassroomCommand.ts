import { ClassroomRepository } from "../../../../infrastructure/repositories/ClassroomRepository";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface UpdateClassroomCommandRequest {
  id: string;
  data: {
    name?: string;
    location?: string;
    capacity?: number;
    isActive?: boolean;
  };
}

export class UpdateClassroomCommandHandler implements ICommandHandler<UpdateClassroomCommandRequest, any> {
  private classroomRepository: ClassroomRepository;

  constructor() {
    this.classroomRepository = new ClassroomRepository();
  }

  async execute(command: UpdateClassroomCommandRequest) {
    const { id, data } = command;

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
}
