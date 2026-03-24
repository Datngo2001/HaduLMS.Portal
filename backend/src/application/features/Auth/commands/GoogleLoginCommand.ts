import jwt from "jsonwebtoken";
import { UserRepository } from "../../../../infrastructure/repositories/UserRepository";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface GoogleLoginCommandRequest {
  googleUserInfo: any;
}

export class GoogleLoginCommandHandler implements ICommandHandler<GoogleLoginCommandRequest, { user: any; token: string }> {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(command: GoogleLoginCommandRequest): Promise<{ user: any; token: string }> {
    const { googleUserInfo } = command;
    const { email, given_name, family_name, picture } = googleUserInfo;

    if (!email) {
      throw new Error("Email not provided by Google");
    }

    let user = await this.userRepository.findUnique({ where: { email } });

    if (!user) {
      user = await this.userRepository.create({
        data: {
          email,
          firstName: given_name || "Unknown",
          lastName: family_name || "User",
          password: "", // Google users don't have a password
          role: "STUDENT", // Default role for Google sign-ups
          avatar: picture,
        }
      });
    } else {
      if (picture && !user.avatar) {
        user = await this.userRepository.update({ where: { id: user.id }, data: { avatar: picture } });
      }
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
