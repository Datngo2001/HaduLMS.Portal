import bcrypt from "bcryptjs";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { EnrollmentRepository } from "../../infrastructure/repositories/EnrollmentRepository";
import { CourseRepository } from "../../infrastructure/repositories/CourseRepository";

export class UserService {
  private userRepository: UserRepository;
  private enrollmentRepository: EnrollmentRepository;
  private courseRepository: CourseRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.enrollmentRepository = new EnrollmentRepository();
    this.courseRepository = new CourseRepository();
  }

  async getProfile(userId: string) {
    return await this.userRepository.getProfileById(userId);
  }

  async getEnrollments(userId: string) {
    return await this.enrollmentRepository.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            creator: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });
  }

  async getCreatedCourses(userId: string) {
    return await this.courseRepository.findMany({
      where: { creatorId: userId },
      include: {
        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string }) {
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

  async getUsers(search?: string, role?: string, status?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.isActive = status === "active";
    }

    const [users, total] = await Promise.all([
      this.userRepository.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          phone: true,
          isActive: true,
          // @ts-ignore
          hasFaceRegistered: true,
          // @ts-ignore
          faceRegisteredAt: true,
          createdAt: true,
          _count: {
            select: {
              createdCourses: true,
              enrollments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.userRepository.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findMany({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        phone: true,
        isActive: true,
        // @ts-ignore
        hasFaceRegistered: true,
        // @ts-ignore
        faceRegisteredAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            createdCourses: true,
            enrollments: true,
          },
        },
      },
    });

    if (!user || user.length === 0) {
      throw new Error("User not found");
    }

    return user[0];
  }

  async createUser(data: any) {
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

  async updateUser(id: string, data: any) {
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

  async toggleUserStatus(id: string, isActive: boolean, requestingUserId: string) {
    if (requestingUserId === id && !isActive) {
      throw new Error("Cannot disable your own account");
    }

    return await this.userRepository.update({
      where: { id },
      data: { isActive }
    });
  }
}
