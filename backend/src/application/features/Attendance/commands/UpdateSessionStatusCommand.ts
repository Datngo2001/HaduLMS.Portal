import { ClassroomSessionRepository } from "../../../../infrastructure/repositories/ClassroomSessionRepository";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface UpdateSessionStatusCommandRequest {
  sessionId: string;
  teacherId: string;
  isActive: boolean;
}

export class UpdateSessionStatusCommandHandler implements ICommandHandler<UpdateSessionStatusCommandRequest, any> {
  private sessionRepository: ClassroomSessionRepository;

  constructor() {
    this.sessionRepository = new ClassroomSessionRepository();
  }

  async execute(command: UpdateSessionStatusCommandRequest) {
    const { sessionId, teacherId, isActive } = command;

    const session = await this.sessionRepository.findFirst({
      where: { id: sessionId, teacherId },
    });

    if (!session) throw new Error("Session not found or access denied");

    return await this.sessionRepository.update({
      where: { id: sessionId },
      data: { isActive },
    });
  }
}
