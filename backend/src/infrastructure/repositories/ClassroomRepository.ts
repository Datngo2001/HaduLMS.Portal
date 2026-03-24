import { Prisma, Classroom } from "@prisma/client";
import { prisma } from "../../infrastructure/prismaClient";

export class ClassroomRepository {
  async findMany(args: Prisma.ClassroomFindManyArgs) {
    return prisma.classroom.findMany(args);
  }

  async findUnique(args: Prisma.ClassroomFindUniqueArgs) {
    return prisma.classroom.findUnique(args);
  }

  async findFirst(args: Prisma.ClassroomFindFirstArgs) {
    return prisma.classroom.findFirst(args);
  }

  async create(args: Prisma.ClassroomCreateArgs) {
    return prisma.classroom.create(args);
  }

  async update(args: Prisma.ClassroomUpdateArgs) {
    return prisma.classroom.update(args);
  }

  async delete(args: Prisma.ClassroomDeleteArgs) {
    return prisma.classroom.delete(args);
  }

  async count(args?: Prisma.ClassroomCountArgs) {
    return prisma.classroom.count(args);
  }
}
