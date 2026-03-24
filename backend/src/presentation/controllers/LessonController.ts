import { Request, Response } from "express";
import { GetLessonsByCourseIdQueryHandler } from "../../application/features/Lesson/queries/GetLessonsByCourseIdQuery";
import { GetLessonByIdQueryHandler } from "../../application/features/Lesson/queries/GetLessonByIdQuery";
import { CreateLessonCommandHandler } from "../../application/features/Lesson/commands/CreateLessonCommand";
import { UpdateLessonCommandHandler } from "../../application/features/Lesson/commands/UpdateLessonCommand";
import { DeleteLessonCommandHandler } from "../../application/features/Lesson/commands/DeleteLessonCommand";
import { sendResponse, handleValidationErrors } from "../utils/response";
import { AuthenticatedRequest } from "../middleware/auth";

export class LessonController {
  private getLessonsByCourseIdQueryHandler: GetLessonsByCourseIdQueryHandler;
  private getLessonByIdQueryHandler: GetLessonByIdQueryHandler;
  private createLessonCommandHandler: CreateLessonCommandHandler;
  private updateLessonCommandHandler: UpdateLessonCommandHandler;
  private deleteLessonCommandHandler: DeleteLessonCommandHandler;

  constructor() {
    this.getLessonsByCourseIdQueryHandler = new GetLessonsByCourseIdQueryHandler();
    this.getLessonByIdQueryHandler = new GetLessonByIdQueryHandler();
    this.createLessonCommandHandler = new CreateLessonCommandHandler();
    this.updateLessonCommandHandler = new UpdateLessonCommandHandler();
    this.deleteLessonCommandHandler = new DeleteLessonCommandHandler();
  }

  getLessonsByCourseId = async (req: Request, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      const courseId = req.params.courseId as string;
      const lessons = await this.getLessonsByCourseIdQueryHandler.execute({ courseId });
      return sendResponse(res, 200, lessons);
    } catch (error: any) {
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  getLessonById = async (req: Request, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      const id = req.params.id as string;
      const lesson = await this.getLessonByIdQueryHandler.execute({ id });
      return sendResponse(res, 200, lesson);
    } catch (error: any) {
      if (error.message === "Lesson not found") {
        return sendResponse(res, 404, null, error.message);
      }
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  createLesson = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const lesson = await this.createLessonCommandHandler.execute({ userId: req.user!.id, userRole: req.user!.role, data: req.body });
      return sendResponse(res, 201, lesson);
    } catch (error: any) {
      if (error.message === "Title and courseId are required") return sendResponse(res, 400, null, error.message);
      if (error.message === "Course not found") return sendResponse(res, 404, null, error.message);
      if (error.message === "Not authorized to add lessons to this course") return sendResponse(res, 403, null, error.message);
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  updateLesson = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (handleValidationErrors(req as Request, res)) return;

      const { id } = req.params;
      const lesson = await this.updateLessonCommandHandler.execute({ userId: req.user!.id, userRole: req.user!.role, id, data: req.body });
      return sendResponse(res, 200, lesson);
    } catch (error: any) {
      if (error.message === "Lesson not found") return sendResponse(res, 404, null, error.message);
      if (error.message === "Not authorized to update this lesson") return sendResponse(res, 403, null, error.message);
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  deleteLesson = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (handleValidationErrors(req as Request, res)) return;

      const { id } = req.params;
      await this.deleteLessonCommandHandler.execute({ userId: req.user!.id, userRole: req.user!.role, id });
      return sendResponse(res, 200, { message: "Lesson deleted successfully" });
    } catch (error: any) {
      if (error.message === "Lesson not found") return sendResponse(res, 404, null, error.message);
      if (error.message === "Not authorized to delete this lesson") return sendResponse(res, 403, null, error.message);
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };
}
