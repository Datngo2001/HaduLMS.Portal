import { Prisma, ClassroomSession } from "@prisma/client";
import { prisma } from "../../infrastructure/prismaClient";

export class ClassroomSessionRepository {
  async findMany(args: Prisma.ClassroomSessionFindManyArgs) {
    return prisma.classroomSession.findMany(args);
  }

  async findUnique(args: Prisma.ClassroomSessionFindUniqueArgs) {
    return prisma.classroomSession.findUnique(args);
  }

  async findFirst(args: Prisma.ClassroomSessionFindFirstArgs) {
    return prisma.classroomSession.findFirst(args);
  }

  async create(args: Prisma.ClassroomSessionCreateArgs) {
    return prisma.classroomSession.create(args);
  }

  async update(args: Prisma.ClassroomSessionUpdateArgs) {
    return prisma.classroomSession.update(args);
  }

  async delete(args: Prisma.ClassroomSessionDeleteArgs) {
    return prisma.classroomSession.delete(args);
  }

  async count(args?: Prisma.ClassroomSessionCountArgs) {
    return prisma.classroomSession.count(args);
  }
}
