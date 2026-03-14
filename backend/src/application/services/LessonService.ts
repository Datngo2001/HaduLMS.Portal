import { LessonRepository } from "../../infrastructure/repositories/LessonRepository";
import { CourseRepository } from "../../infrastructure/repositories/CourseRepository";

export class LessonService {
  private lessonRepository: LessonRepository;
  private courseRepository: CourseRepository;

  constructor() {
    this.lessonRepository = new LessonRepository();
    this.courseRepository = new CourseRepository();
  }

  async getLessonsByCourseId(courseId: string) {
    return await this.lessonRepository.findMany({
      where: {
        courseId,
        isPublished: true,
      },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        content: true,
        videoUrl: true,
        duration: true,
        order: true,
      },
    });
  }

  async getLessonById(id: string) {
    const lesson = await this.lessonRepository.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!lesson || !lesson.isPublished) {
      throw new Error("Lesson not found");
    }

    return lesson;
  }

  async createLesson(userId: string, userRole: string, data: any) {
    if (!data.title || !data.courseId) {
      throw new Error("Title and courseId are required");
    }

    const courses = await this.courseRepository.findMany({
      where: { id: data.courseId },
    });
    
    const course = courses[0];

    if (!course) {
      throw new Error("Course not found");
    }

    if (course.creatorId !== userId && userRole !== "ADMIN") {
      throw new Error("Not authorized to add lessons to this course");
    }

    return await this.lessonRepository.create({
      data: {
        title: data.title,
        content: data.content,
        courseId: data.courseId,
        videoUrl: data.videoUrl,
        duration: data.duration ? parseInt(data.duration) : null,
        order: data.order ? parseInt(data.order) : 0,
        creatorId: userId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async updateLesson(userId: string, userRole: string, id: string, data: any) {
    const existingLesson = await this.lessonRepository.findUnique({
      where: { id },
    });

    if (!existingLesson) {
      throw new Error("Lesson not found");
    }
    
    const course = await this.courseRepository.findMany({
      where: { id: existingLesson.courseId },
    });

    if (!course[0] || (course[0].creatorId !== userId && userRole !== "ADMIN")) {
      throw new Error("Not authorized to update this lesson");
    }

    return await this.lessonRepository.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
        ...(data.duration !== undefined && {
          duration: data.duration ? parseInt(data.duration) : null,
        }),
        ...(data.order !== undefined && { order: parseInt(data.order) }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async deleteLesson(userId: string, userRole: string, id: string) {
    const existingLesson = await this.lessonRepository.findUnique({
      where: { id },
    });

    if (!existingLesson) {
      throw new Error("Lesson not found");
    }

    const course = await this.courseRepository.findMany({
      where: { id: existingLesson.courseId },
    });

    if (!course[0] || (course[0].creatorId !== userId && userRole !== "ADMIN")) {
      throw new Error("Not authorized to delete this lesson");
    }

    await this.lessonRepository.delete({
      where: { id },
    });
    
    return true;
  }
}
