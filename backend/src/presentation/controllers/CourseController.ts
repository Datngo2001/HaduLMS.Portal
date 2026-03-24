import { Request, Response } from "express";
import { GetPublishedCoursesQueryHandler } from "../../application/features/Course/queries/GetPublishedCoursesQuery";
import { GetCourseByIdQueryHandler } from "../../application/features/Course/queries/GetCourseByIdQuery";
import { CreateCourseCommandHandler } from "../../application/features/Course/commands/CreateCourseCommand";
import { UpdateCourseCommandHandler } from "../../application/features/Course/commands/UpdateCourseCommand";
import { EnrollInCourseCommandHandler } from "../../application/features/Course/commands/EnrollInCourseCommand";
import { sendResponse, handleValidationErrors } from "../utils/response";
import { AuthenticatedRequest } from "../middleware/auth";

export class CourseController {
  private getPublishedCoursesQueryHandler: GetPublishedCoursesQueryHandler;
  private getCourseByIdQueryHandler: GetCourseByIdQueryHandler;
  private createCourseCommandHandler: CreateCourseCommandHandler;
  private updateCourseCommandHandler: UpdateCourseCommandHandler;
  private enrollInCourseCommandHandler: EnrollInCourseCommandHandler;

  constructor() {
    this.getPublishedCoursesQueryHandler = new GetPublishedCoursesQueryHandler();
    this.getCourseByIdQueryHandler = new GetCourseByIdQueryHandler();
    this.createCourseCommandHandler = new CreateCourseCommandHandler();
    this.updateCourseCommandHandler = new UpdateCourseCommandHandler();
    this.enrollInCourseCommandHandler = new EnrollInCourseCommandHandler();
  }

  getPublishedCourses = async (req: Request, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";

      const result = await this.getPublishedCoursesQueryHandler.execute({ page, limit, search: search as string });
      return sendResponse(res, 200, result);
    } catch (error: any) {
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  getCourseById = async (req: Request, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      const { id } = req.params;
      const course = await this.getCourseByIdQueryHandler.execute({ id: id as string });
      return sendResponse(res, 200, course);
    } catch (error: any) {
      if (error.message === "Course not found") {
        return sendResponse(res, 404, null, error.message);
      }
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  createCourse = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const course = await this.createCourseCommandHandler.execute({ userId: req.user!.id, data: req.body });
      return sendResponse(res, 201, course);
    } catch (error: any) {
      if (error.message === "Title is required") {
        return sendResponse(res, 400, null, error.message);
      }
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  updateCourse = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (handleValidationErrors(req as Request, res)) return;

      const { id } = req.params;
      const course = await this.updateCourseCommandHandler.execute({ userId: req.user!.id, userRole: req.user!.role, courseId: id, data: req.body });
      return sendResponse(res, 200, course);
    } catch (error: any) {
      if (error.message === "Course not found") return sendResponse(res, 404, null, error.message);
      if (error.message === "Not authorized to update this course") return sendResponse(res, 403, null, error.message);
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  enrollInCourse = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (handleValidationErrors(req as Request, res)) return;

      const { id } = req.params;
      const enrollment = await this.enrollInCourseCommandHandler.execute({ userId: req.user!.id, courseId: id });
      return sendResponse(res, 201, enrollment);
    } catch (error: any) {
      if (error.message === "Course not found or not available") return sendResponse(res, 404, null, error.message);
      if (error.message === "Already enrolled in this course") return sendResponse(res, 400, null, error.message);
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };
}
