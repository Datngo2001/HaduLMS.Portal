import { Prisma, Enrollment } from "@prisma/client";
import { prisma } from "../../prismaClient";

export class EnrollmentRepository {
  async findMany(args: Prisma.EnrollmentFindManyArgs) {
    return prisma.enrollment.findMany(args);
  }

  async count(args?: Prisma.EnrollmentCountArgs) {
    return prisma.enrollment.count(args);
  }
}
