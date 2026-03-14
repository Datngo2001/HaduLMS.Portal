import { Request, Response } from "express";
import { UserService } from "../../application/services/UserService";
import { sendResponse, handleValidationErrors } from "../../utils/response";
import { AuthenticatedRequest } from "../../middleware/auth";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await this.userService.getProfile(req.user!.id);
      if (!user) {
        return sendResponse(res, 404, null, "User not found");
      }
      return sendResponse(res, 200, user);
    } catch (error: any) {
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  getEnrollments = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const enrollments = await this.userService.getEnrollments(req.user!.id);
      return sendResponse(res, 200, enrollments);
    } catch (error: any) {
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  getCourses = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user!.role === "STUDENT") {
        return sendResponse(res, 403, null, "Students cannot access this endpoint");
      }
      const courses = await this.userService.getCreatedCourses(req.user!.id);
      return sendResponse(res, 200, courses);
    } catch (error: any) {
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { firstName, lastName } = req.body;
      const user = await this.userService.updateProfile(req.user!.id, { firstName, lastName });
      
      const { password, ...userWithoutPassword } = user;
      return sendResponse(res, 200, userWithoutPassword);
    } catch (error: any) {
      if (error.message === "No valid fields to update") {
        return sendResponse(res, 400, null, error.message);
      }
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  getUsers = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (handleValidationErrors(req as Request, res)) return;

      const { search, role, status, page = "1", limit = "10" } = req.query;
      
      const result = await this.userService.getUsers(
        search as string,
        role as string,
        status as string,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return sendResponse(res, 200, result);
    } catch (error: any) {
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  getUserById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (handleValidationErrors(req as Request, res)) return;

      const { id } = req.params;
      const user = await this.userService.getUserById(id);

      return sendResponse(res, 200, user);
    } catch (error: any) {
      if (error.message === "User not found") {
        return sendResponse(res, 404, null, error.message);
      }
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  createUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (handleValidationErrors(req as Request, res)) return;

      const user = await this.userService.createUser(req.body);
      
      const { password, ...userWithoutPassword } = user;
      return sendResponse(res, 201, userWithoutPassword, "User created successfully");
    } catch (error: any) {
      if (error.message === "User already exists with this email") {
        return sendResponse(res, 400, null, error.message);
      }
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  updateUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (handleValidationErrors(req as Request, res)) return;

      const { id } = req.params;
      const user = await this.userService.updateUser(id, req.body);
      
      const { password, ...userWithoutPassword } = user;
      return sendResponse(res, 200, userWithoutPassword, "User updated successfully");
    } catch (error: any) {
      if (error.message === "User not found") return sendResponse(res, 404, null, error.message);
      if (error.message === "Email already taken by another user" || error.message === "No valid fields to update") {
        return sendResponse(res, 400, null, error.message);
      }
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  toggleUserStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (handleValidationErrors(req as Request, res)) return;

      const { id } = req.params;
      const { isActive } = req.body;
      
      const user = await this.userService.toggleUserStatus(id, isActive, req.user!.id);
      
      const { password, ...userWithoutPassword } = user;
      const action = isActive ? "enabled" : "disabled";
      return sendResponse(res, 200, userWithoutPassword, `User ${action} successfully`);
    } catch (error: any) {
      if (error.message === "Cannot disable your own account") {
        return sendResponse(res, 400, null, error.message);
      }
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };
}
