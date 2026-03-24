import { prisma } from "../../../../prismaClient";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface CreateCourseCommandRequest {
  userId: string;
  data: {
    title: string;
    description?: string;
    price?: number;
  };
}

export class CreateCourseCommandHandler implements ICommandHandler<CreateCourseCommandRequest, any> {
  async execute(command: CreateCourseCommandRequest) {
    const { userId, data } = command;

    if (!data.title) {
      throw new Error("Title is required");
    }

    return await prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price ? parseFloat(data.price.toString()) : 0,
        creatorId: userId,
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }
}
