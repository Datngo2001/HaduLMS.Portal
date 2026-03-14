import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRole } from "../../middleware/auth";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(email: string, password: string):Promise<{ user: any; token: string }> {
    const user = await this.userRepository.findUnique({ where: { email } });

    if (!user) {
      throw new Error("Invalid credentials");
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

  async googleLogin(googleUserInfo: any): Promise<{ user: any; token: string }> {
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

  async getMe(userId: string) {
    const user = await this.userRepository.getProfileById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }
}
