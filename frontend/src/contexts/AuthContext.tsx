import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { api } from "../services/api";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  avatar?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (accessToken: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  isLoading: boolean;
}

interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: "STUDENT" | "TEACHER";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authCheckInProgress = useRef(false);

  // Check if user is already authenticated on app load
  useEffect(() => {
    let isCancelled = false; // Prevent state updates if component unmounts

    const checkAuthStatus = async () => {
      // Prevent multiple simultaneous auth checks
      if (authCheckInProgress.current) {
        return;
      }

      try {
        authCheckInProgress.current = true;
        const response = await api.get("/auth/me");

        // Only update state if component is still mounted
        if (!isCancelled) {
          const { user } = response.data.data;
          setUser(user);
        }
      } catch (error) {
        // Only update state if component is still mounted
        if (!isCancelled) {
          setUser(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          authCheckInProgress.current = false;
        }
      }
    };

    checkAuthStatus();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isCancelled = true;
      authCheckInProgress.current = false;
    };
  }, []); // Empty dependency array - only run once on mount

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { user } = response.data.data;

      setUser(user);
      // Cookie is automatically set by the backend
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Login failed");
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await api.post("/auth/register", userData);
      const { user } = response.data.data;

      setUser(user);
      // Cookie is automatically set by the backend
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Registration failed");
    }
  };

  const loginWithGoogle = async (accessToken: string) => {
    try {
      // Send the access token to backend for verification
      const response = await api.post("/auth/google", {
        token: accessToken,
      });

      const { user } = response.data.data;

      setUser(user);
      // Cookie is automatically set by the backend
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Google login failed");
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
      setUser(null);
      // Cookie is automatically cleared by the backend
    } catch (error) {
      // Even if the request fails, we should clear the user state
      setUser(null);
    }
  };

  const refreshAuth = async () => {
    try {
      const response = await api.get("/auth/me");
      const { user } = response.data.data;
      setUser(user);
    } catch (error) {
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    loginWithGoogle,
    register,
    logout,
    refreshAuth,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
