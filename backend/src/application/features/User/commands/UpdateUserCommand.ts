import bcrypt from "bcryptjs";
import { UserRepository } from "../../../../infrastructure/repositories/UserRepository";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface UpdateUserCommandRequest {
  id: string;
  data: any;
}

export class UpdateUserCommandHandler implements ICommandHandler<UpdateUserCommandRequest, any> {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(command: UpdateUserCommandRequest) {
    const { id, data } = command;

    const existingUser = await this.userRepository.findUnique({ where: { id } });
    if (!existingUser) {
      throw new Error("User not found");
    }

    if (data.email && data.email !== existingUser.email) {
      const emailExists = await this.userRepository.findUnique({ where: { email: data.email } });
      if (emailExists) {
        throw new Error("Email already taken by another user");
      }
    }

    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.role) updateData.role = data.role;
    if (data.phone !== undefined) updateData.phone = data.phone;

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No valid fields to update");
    }

    return await this.userRepository.update({
      where: { id },
      data: updateData
    });
  }
}
