import { Request, Response } from "express";
import { GetProfileQueryHandler } from "../../application/features/User/queries/GetProfileQuery";
import { GetEnrollmentsQueryHandler } from "../../application/features/User/queries/GetEnrollmentsQuery";
import { GetCreatedCoursesQueryHandler } from "../../application/features/User/queries/GetCreatedCoursesQuery";
import { GetUsersQueryHandler } from "../../application/features/User/queries/GetUsersQuery";
import { GetUserByIdQueryHandler } from "../../application/features/User/queries/GetUserByIdQuery";
import { UpdateProfileCommandHandler } from "../../application/features/User/commands/UpdateProfileCommand";
import { CreateUserCommandHandler } from "../../application/features/User/commands/CreateUserCommand";
import { UpdateUserCommandHandler } from "../../application/features/User/commands/UpdateUserCommand";
import { ToggleUserStatusCommandHandler } from "../../application/features/User/commands/ToggleUserStatusCommand";
import { sendResponse, handleValidationErrors } from "../utils/response";
import { AuthenticatedRequest } from "../middleware/auth";

export class UserController {
  private getProfileQueryHandler: GetProfileQueryHandler;
  private getEnrollmentsQueryHandler: GetEnrollmentsQueryHandler;
  private getCreatedCoursesQueryHandler: GetCreatedCoursesQueryHandler;
  private getUsersQueryHandler: GetUsersQueryHandler;
  private getUserByIdQueryHandler: GetUserByIdQueryHandler;
  private updateProfileCommandHandler: UpdateProfileCommandHandler;
  private createUserCommandHandler: CreateUserCommandHandler;
  private updateUserCommandHandler: UpdateUserCommandHandler;
  private toggleUserStatusCommandHandler: ToggleUserStatusCommandHandler;

  constructor() {
    this.getProfileQueryHandler = new GetProfileQueryHandler();
    this.getEnrollmentsQueryHandler = new GetEnrollmentsQueryHandler();
    this.getCreatedCoursesQueryHandler = new GetCreatedCoursesQueryHandler();
    this.getUsersQueryHandler = new GetUsersQueryHandler();
    this.getUserByIdQueryHandler = new GetUserByIdQueryHandler();
    this.updateProfileCommandHandler = new UpdateProfileCommandHandler();
    this.createUserCommandHandler = new CreateUserCommandHandler();
    this.updateUserCommandHandler = new UpdateUserCommandHandler();
    this.toggleUserStatusCommandHandler = new ToggleUserStatusCommandHandler();
  }

  getProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await this.getProfileQueryHandler.execute({ userId: req.user!.id });
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
      const enrollments = await this.getEnrollmentsQueryHandler.execute({ userId: req.user!.id });
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
      const courses = await this.getCreatedCoursesQueryHandler.execute({ userId: req.user!.id });
      return sendResponse(res, 200, courses);
    } catch (error: any) {
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { firstName, lastName } = req.body;
      const user = await this.updateProfileCommandHandler.execute({ userId: req.user!.id, data: { firstName, lastName } });
      
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
      
      const result = await this.getUsersQueryHandler.execute({
        search: search as string,
        role: role as string,
        status: status as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      return sendResponse(res, 200, result);
    } catch (error: any) {
      return sendResponse(res, 500, null, error.message || "Internal server error");
    }
  };

  getUserById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (handleValidationErrors(req as Request, res)) return;

      const { id } = req.params;
      const user = await this.getUserByIdQueryHandler.execute({ id });

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

      const user = await this.createUserCommandHandler.execute({ data: req.body });
      
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
      const user = await this.updateUserCommandHandler.execute({ id, data: req.body });
      
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
      
      const user = await this.toggleUserStatusCommandHandler.execute({ id, isActive, requestingUserId: req.user!.id });
      
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
