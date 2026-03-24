import { Prisma, Attendance } from "@prisma/client";
import { prisma } from "../../infrastructure/prismaClient";

export class AttendanceRepository {
  async findMany(args: Prisma.AttendanceFindManyArgs) {
    return prisma.attendance.findMany(args);
  }

  async findUnique(args: Prisma.AttendanceFindUniqueArgs) {
    return prisma.attendance.findUnique(args);
  }

  async findFirst(args: Prisma.AttendanceFindFirstArgs) {
    return prisma.attendance.findFirst(args);
  }

  async create(args: Prisma.AttendanceCreateArgs) {
    return prisma.attendance.create(args);
  }

  async update(args: Prisma.AttendanceUpdateArgs) {
    return prisma.attendance.update(args);
  }

  async delete(args: Prisma.AttendanceDeleteArgs) {
    return prisma.attendance.delete(args);
  }

  async count(args?: Prisma.AttendanceCountArgs) {
    return prisma.attendance.count(args);
  }
}
