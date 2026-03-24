import { ClassroomRepository } from "../../../../infrastructure/repositories/ClassroomRepository";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface CreateClassroomCommandRequest {
  name: string;
  location?: string;
  capacity?: number;
}

export class CreateClassroomCommandHandler implements ICommandHandler<CreateClassroomCommandRequest, any> {
  private classroomRepository: ClassroomRepository;

  constructor() {
    this.classroomRepository = new ClassroomRepository();
  }

  async execute(command: CreateClassroomCommandRequest) {
    const { name, location, capacity } = command;

    if (!name) throw new Error("Classroom name is required");

    const existingClassroom = await this.classroomRepository.findFirst({
      where: { name },
    });

    if (existingClassroom) throw new Error("Classroom with this name already exists");

    return await this.classroomRepository.create({
      data: {
        name,
        location,
        capacity,
      },
      include: {
        _count: {
          select: { students: true, sessions: true },
        },
      },
    });
  }
}
