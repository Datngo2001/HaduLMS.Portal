import { UserRepository } from "../../../../infrastructure/repositories/UserRepository";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface ToggleUserStatusCommandRequest {
  id: string;
  isActive: boolean;
  requestingUserId: string;
}

export class ToggleUserStatusCommandHandler implements ICommandHandler<ToggleUserStatusCommandRequest, any> {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(command: ToggleUserStatusCommandRequest) {
    const { id, isActive, requestingUserId } = command;

    if (requestingUserId === id && !isActive) {
      throw new Error("Cannot disable your own account");
    }

    return await this.userRepository.update({
      where: { id },
      data: { isActive }
    });
  }
}
