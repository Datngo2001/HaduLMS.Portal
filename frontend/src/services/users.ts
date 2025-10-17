import { api } from "./_api";

// User Management API
export const userAPI = {
  // Get all users (admin only)
  getUsers: async (queryParams?: string) => {
    const url = queryParams ? `/users?${queryParams}` : "/users";
    const response = await api.get(url);
    return response.data.data;
  },

  // Get user by ID (admin only)
  getUserById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },

  // Create user (admin only)
  createUser: async (userData: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: string;
    phone?: string;
  }) => {
    const response = await api.post("/users", userData);
    return response.data.data;
  },

  // Update user (admin only)
  updateUser: async (
    id: string,
    userData: {
      email?: string;
      firstName?: string;
      lastName?: string;
      role?: string;
      phone?: string;
      password?: string;
    }
  ) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data.data;
  },

  // Toggle user status (admin only)
  toggleUserStatus: async (id: string, isActive: boolean) => {
    const response = await api.patch(`/users/${id}/status`, { isActive });
    return response.data.data;
  },
};
