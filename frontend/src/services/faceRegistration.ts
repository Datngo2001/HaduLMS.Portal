import { api } from "./_api";

export interface FaceRegistrationResponse {
  message: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  personId: string;
}

export interface TeacherCheckInResponse {
  id: string;
  userId: string;
  sessionId: string;
  status: string;
  checkinTime: string;
  checkinMethod: string;
  confidence: number;
  message: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  session: {
    title: string;
    classroom: {
      name: string;
    };
  };
}

export const faceRegistrationAPI = {
  // Register face for current user
  registerFace: async (
    image: string
  ): Promise<{ message: string; personId: string }> => {
    const response = await api.post("/attendance/register-face", { image });
    return response.data.data;
  },

  // Register face for student (teacher only)
  registerStudentFace: async (
    studentId: string,
    image: string
  ): Promise<FaceRegistrationResponse> => {
    const response = await api.post("/attendance/register-student-face", {
      studentId,
      image,
    });
    return response.data.data;
  },

  // Delete user's own face registration
  deleteFaceRegistration: async (): Promise<{ message: string }> => {
    const response = await api.delete("/attendance/register-face");
    return response.data.data;
  },

  // Teacher assisted check-in (teacher checks in students)
  teacherCheckIn: async (image: string): Promise<TeacherCheckInResponse> => {
    const response = await api.post("/attendance/teacher-checkin", { image });
    return response.data.data;
  },
};

export default faceRegistrationAPI;
