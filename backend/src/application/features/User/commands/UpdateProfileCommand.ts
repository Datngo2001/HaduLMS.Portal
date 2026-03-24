import { UserRepository } from "../../../../infrastructure/repositories/UserRepository";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface UpdateProfileCommandRequest {
  userId: string;
  data: {
    firstName?: string;
    lastName?: string;
  };
}

export class UpdateProfileCommandHandler implements ICommandHandler<UpdateProfileCommandRequest, any> {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(command: UpdateProfileCommandRequest) {
    const { userId, data } = command;

    const updateData: any = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;

    if (Object.keys(updateData).length === 0) {
      throw new Error("No valid fields to update");
    }

    return await this.userRepository.update({
      where: { id: userId },
      data: { ...updateData },
    });
  }
}
