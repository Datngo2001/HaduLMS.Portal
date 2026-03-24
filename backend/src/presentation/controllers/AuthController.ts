import { Request, Response } from "express";
import fetch from "node-fetch";
import { LoginCommandHandler } from "../../application/features/Auth/commands/LoginCommand";
import { GoogleLoginCommandHandler } from "../../application/features/Auth/commands/GoogleLoginCommand";
import { GetMeQueryHandler } from "../../application/features/Auth/queries/GetMeQuery";
import { sendResponse } from "../utils/response";
import { AuthenticatedRequest } from "../middleware/auth";

export class AuthController {
  private loginCommandHandler: LoginCommandHandler;
  private googleLoginCommandHandler: GoogleLoginCommandHandler;
  private getMeQueryHandler: GetMeQueryHandler;

  constructor() {
    this.loginCommandHandler = new LoginCommandHandler();
    this.googleLoginCommandHandler = new GoogleLoginCommandHandler();
    this.getMeQueryHandler = new GetMeQueryHandler();
  }

  private setAuthCookie(res: Response, token: string) {
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });
  }

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const { user, token } = await this.loginCommandHandler.execute({ email, password });

      this.setAuthCookie(res, token);
      return sendResponse(res, 200, { user, token }, undefined);
    } catch (error: any) {
      const statusCode =
        error.message === "Invalid credentials" || error.message === "Access denied"
          ? (error.message === "Access denied" ? 403 : 401)
          : 500;
      return sendResponse(res, statusCode, null, error.message || "Internal server error");
    }
  };

  googleLogin = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      // Verify Google access token by fetching user info
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`,
      );

      if (!response.ok) {
        return sendResponse(res, 400, null, "Invalid Google token");
      }

      const googleUserInfo: any = await response.json();
      
      const { user, token: jwtToken } = await this.googleLoginCommandHandler.execute({ googleUserInfo });

      this.setAuthCookie(res, jwtToken);
      return sendResponse(res, 200, { user, token: jwtToken }, undefined);
    } catch (error: any) {
      console.error("Google OAuth error:", error);
      return sendResponse(res, 400, null, error.message || "Failed to authenticate with Google");
    }
  };

  getMe = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return sendResponse(res, 401, null, "Unauthorized");
      }
      const user = await this.getMeQueryHandler.execute({ userId: req.user.id });
      return sendResponse(res, 200, { user }, undefined);
    } catch (error: any) {
      if (error.message === "User not found") {
        return sendResponse(res, 404, null, "User not found");
      }
      return sendResponse(res, 500, null, "Internal server error");
    }
  };

  logout = (req: Request, res: Response) => {
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    return sendResponse(res, 200, { message: "Logged out successfully" }, undefined);
  };
}
