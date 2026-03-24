import { Prisma, Lesson } from "@prisma/client";
import { prisma } from "../../infrastructure/prismaClient";

export class LessonRepository {
  async findMany(args: Prisma.LessonFindManyArgs) {
    return prisma.lesson.findMany(args);
  }

  async findUnique(args: Prisma.LessonFindUniqueArgs) {
    return prisma.lesson.findUnique(args);
  }

  async create(args: Prisma.LessonCreateArgs) {
    return prisma.lesson.create(args);
  }

  async update(args: Prisma.LessonUpdateArgs) {
    return prisma.lesson.update(args);
  }

  async delete(args: Prisma.LessonDeleteArgs) {
    return prisma.lesson.delete(args);
  }

  async count(args?: Prisma.LessonCountArgs) {
    return prisma.lesson.count(args);
  }
}
