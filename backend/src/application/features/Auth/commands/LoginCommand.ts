import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRole } from "../../../../presentation/middleware/auth";
import { UserRepository } from "../../../../infrastructure/repositories/UserRepository";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface LoginCommandRequest {
  email: string;
  password?: string;
}

export class LoginCommandHandler implements ICommandHandler<LoginCommandRequest, { user: any; token: string }> {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(command: LoginCommandRequest): Promise<{ user: any; token: string }> {
    const { email, password } = command;
    const user = await this.userRepository.findUnique({ where: { email } });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (!password) {
      throw new Error("Password is required");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    if (user.role !== UserRole.ADMIN) {
      throw new Error("Access denied");
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
    );

    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }
}
