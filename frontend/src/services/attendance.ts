import { api } from "./_api";

export interface AttendanceRecord {
  id: string;
  userId: string;
  sessionId: string | null;
  status: "PRESENT" | "LATE" | "ABSENT";
  checkinTime: string;
  checkinMethod: "FACE_RECOGNITION" | "TEACHER_ASSISTED" | "QR_CODE";
  confidence?: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface SessionAttendance {
  session: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
    classroom: {
      id: string;
      name: string;
      location?: string;
    };
    course?: {
      title: string;
    };
    teacher: {
      firstName: string;
      lastName: string;
    };
  };
  attendances: AttendanceRecord[];
  summary: {
    total: number;
    present: number;
    late: number;
    faceRecognition: number;
    manual: number;
  };
}

export interface ClassroomAttendanceOverview {
  classroom: {
    id: string;
    name: string;
    location?: string;
  };
  sessions: SessionAttendance[];
  standaloneAttendances: AttendanceRecord[];
  totalStudents: number;
  overallSummary: {
    totalSessions: number;
    sessionAttendances: number;
    standaloneAttendances: number;
    totalAttendances: number;
    averageAttendance: number;
    topStudents: {
      user: {
        id: string;
        firstName: string;
        lastName: string;
      };
      attendanceCount: number;
      attendanceRate: number;
    }[];
  };
}

export const attendanceAPI = {
  // Get attendance for a specific session
  getSessionAttendance: async (
    sessionId: string
  ): Promise<SessionAttendance> => {
    const response = await api.get(
      `/attendance/sessions/${sessionId}/attendance`
    );
    return response.data.data;
  },

  // Get overall classroom attendance overview
  getClassroomAttendance: async (
    classroomId: string
  ): Promise<ClassroomAttendanceOverview> => {
    const response = await api.get(
      `/attendance/classrooms/${classroomId}/attendance`
    );
    return response.data.data;
  },
};
