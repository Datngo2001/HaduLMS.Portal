import { Prisma, Course } from "@prisma/client";
import { prisma } from "../../prismaClient";

export class CourseRepository {
  async findMany(args: Prisma.CourseFindManyArgs) {
    return prisma.course.findMany(args);
  }

  async count(args?: Prisma.CourseCountArgs) {
    return prisma.course.count(args);
  }
}
