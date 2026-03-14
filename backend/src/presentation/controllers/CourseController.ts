import { Request, Response } from "express";
import { CourseService } from "../../application/services/CourseService";
import { sendResponse, handleValidationErrors } from "../../utils/response";
import { AuthenticatedRequest } from "../../middleware/auth";

export class CourseController {
  private courseService: CourseService;

  constructor() {
    this.courseService = new CourseService();
  }

  getPublishedCourses = async (req: Request, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";

      const result = await this.courseService.getPublishedCourses(page, limit, search as string);
      return sendResponse(res, 200, result);
    } catch (error: any) {
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  getCourseById = async (req: Request, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      const { id } = req.params;
      const course = await this.courseService.getCourseById(id as string);
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
      const course = await this.courseService.createCourse(req.user!.id, req.body);
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
      const course = await this.courseService.updateCourse(req.user!.id, req.user!.role, id, req.body);
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
      const enrollment = await this.courseService.enrollInCourse(req.user!.id, id);
      return sendResponse(res, 201, enrollment);
    } catch (error: any) {
      if (error.message === "Course not found or not available") return sendResponse(res, 404, null, error.message);
      if (error.message === "Already enrolled in this course") return sendResponse(res, 400, null, error.message);
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };
}
