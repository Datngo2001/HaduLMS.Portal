import { api } from "./_api";

export interface Classroom {
  id: string;
  name: string;
  location?: string;
  capacity?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  students?: User[];
  sessions?: ClassroomSession[];
  _count?: {
    students: number;
    sessions: number;
  };
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

export interface ClassroomSession {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  checkinCode?: string;
  createdAt: string;
  updatedAt: string;
  courseId?: string;
  course?: {
    id: string;
    title: string;
    description?: string;
  };
  teacherId: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  attendances?: {
    id: string;
    studentId: string;
    status: string;
    checkinTime?: string;
    checkinMethod?: string;
  }[];
  _count?: {
    attendances: number;
  };
}

export interface CreateClassroomRequest {
  name: string;
  location?: string;
  capacity?: number;
}

export interface UpdateClassroomRequest {
  name?: string;
  location?: string;
  capacity?: number;
  isActive?: boolean;
}

export interface ClassroomListResponse {
  classrooms: Classroom[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AssignStudentsRequest {
  studentIds: string[];
}

export const classroomAPI = {
  // Get all classrooms with pagination and search
  getClassrooms: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<ClassroomListResponse> => {
    const response = await api.get("/classrooms", { params });
    return response.data.data;
  },

  // Get classroom by ID
  getClassroom: async (id: string): Promise<Classroom> => {
    const response = await api.get(`/classrooms/${id}`);
    return response.data.data;
  },

  // Create new classroom
  createClassroom: async (data: CreateClassroomRequest): Promise<Classroom> => {
    const response = await api.post("/classrooms", data);
    return response.data.data;
  },

  // Update classroom
  updateClassroom: async (
    id: string,
    data: UpdateClassroomRequest
  ): Promise<Classroom> => {
    const response = await api.put(`/classrooms/${id}`, data);
    return response.data.data;
  },

  // Delete classroom
  deleteClassroom: async (id: string): Promise<void> => {
    await api.delete(`/classrooms/${id}`);
  },

  // Assign students to classroom
  assignStudents: async (
    classroomId: string,
    data: AssignStudentsRequest
  ): Promise<Classroom> => {
    const response = await api.post(
      `/classrooms/${classroomId}/students`,
      data
    );
    return response.data.data;
  },

  // Remove student from classroom
  removeStudent: async (
    classroomId: string,
    studentId: string
  ): Promise<void> => {
    await api.delete(`/classrooms/${classroomId}/students/${studentId}`);
  },

  // Get available students (not assigned to any classroom)
  getAvailableStudents: async (
    classroomId: string,
    search?: string
  ): Promise<User[]> => {
    const response = await api.get(
      `/classrooms/${classroomId}/available-students`,
      {
        params: { search },
      }
    );
    return response.data.data;
  },

  // Get classroom sessions
  getClassroomSessions: async (
    classroomId: string,
    params?: {
      page?: number;
      limit?: number;
      upcoming?: boolean;
    }
  ): Promise<{
    sessions: ClassroomSession[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const response = await api.get(`/classrooms/${classroomId}/sessions`, {
      params,
    });
    return response.data.data;
  },

  // Get specific classroom session
  getClassroomSession: async (
    classroomId: string,
    sessionId: string
  ): Promise<ClassroomSession> => {
    const response = await api.get(
      `/classrooms/${classroomId}/sessions/${sessionId}`
    );
    return response.data.data;
  },

  // Create classroom session
  createClassroomSession: async (
    classroomId: string,
    sessionData: {
      title: string;
      startTime: string;
      endTime: string;
      teacherId: string;
      courseId?: string;
      checkinCode?: string;
    }
  ): Promise<ClassroomSession> => {
    const response = await api.post(
      `/classrooms/${classroomId}/sessions`,
      sessionData
    );
    return response.data.data;
  },

  // Update classroom session
  updateClassroomSession: async (
    classroomId: string,
    sessionId: string,
    sessionData: {
      title?: string;
      startTime?: string;
      endTime?: string;
      teacherId?: string;
      courseId?: string;
      checkinCode?: string;
      isActive?: boolean;
    }
  ): Promise<ClassroomSession> => {
    const response = await api.put(
      `/classrooms/${classroomId}/sessions/${sessionId}`,
      sessionData
    );
    return response.data.data;
  },

  // Delete classroom session
  deleteClassroomSession: async (
    classroomId: string,
    sessionId: string
  ): Promise<void> => {
    await api.delete(`/classrooms/${classroomId}/sessions/${sessionId}`);
  },
};

export default classroomAPI;
