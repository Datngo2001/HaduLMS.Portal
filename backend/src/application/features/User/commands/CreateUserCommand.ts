import bcrypt from "bcryptjs";
import { UserRepository } from "../../../../infrastructure/repositories/UserRepository";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface CreateUserCommandRequest {
  data: any;
}

export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommandRequest, any> {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(command: CreateUserCommandRequest) {
    const { data } = command;

    const existingUser = await this.userRepository.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return await this.userRepository.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: hashedPassword,
        role: data.role,
        phone: data.phone,
        isActive: true,
      }
    });
  }
}
