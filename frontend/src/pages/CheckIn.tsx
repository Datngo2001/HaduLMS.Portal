import { AlertCircle, ArrowLeft, CheckCircle, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FaceCapture from "../components/FaceCapture";
import { useAuth } from "../contexts/AuthContext";
import { faceRegistrationAPI } from "../services/faceRegistration";

interface Attendance {
  id: string;
  status: string;
  checkinTime: string;
  checkinMethod: string;
  confidence?: number;
  message?: string; // For teacher check-ins
  user?: {
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

const CheckIn: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Check if user is teacher or admin
  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";

  // Redirect non-teachers
  useEffect(() => {
    if (!isTeacher) {
      navigate("/dashboard");
    }
  }, [isTeacher, navigate]);

  const handleFaceCapture = async (imageData: string) => {
    if (!isTeacher) {
      setError("Access denied. Teacher permissions required.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Teacher mode - check in students
      const response = await faceRegistrationAPI.teacherCheckIn(imageData);
      setAttendance(response);
      setSuccess(true);
    } catch (error: any) {
      console.error("Face check-in error:", error);
      const errorMessage =
        error.response?.data?.error || "Check-in failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (error: string) => {
    setError(error);
  };

  if (!isTeacher) {
    return null; // Will be redirected
  }

  if (success && attendance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Student Check-in Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              {attendance?.user
                ? `${attendance.user.firstName} ${attendance.user.lastName} has been checked in to ${attendance.session.title}`
                : `Student has been checked in to ${attendance.session.title}`}
            </p>

            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Session:</span>
                  <span className="text-sm font-medium">
                    {attendance.session.title}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Classroom:</span>
                  <span className="text-sm font-medium">
                    {attendance.session.classroom.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Check-in Time:</span>
                  <span className="text-sm font-medium">
                    {new Date(attendance.checkinTime).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status:</span>
                  <span
                    className={`text-sm font-medium ${
                      attendance.status === "PRESENT"
                        ? "text-green-600"
                        : attendance.status === "LATE"
                        ? "text-yellow-600"
                        : "text-gray-600"
                    }`}
                  >
                    {attendance.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Method:</span>
                  <span className="text-sm font-medium">Teacher Assisted</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  setSuccess(false);
                  setAttendance(null);
                  setError("");
                }}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Check In Another Student
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </button>

          <h2 className="text-3xl font-extrabold text-gray-900">
            Teacher Check-in
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Use the camera to check in any student - no active session required
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Info Banner */}
          <div className="bg-blue-50 px-6 py-4 border-b">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-blue-600 mr-2" />
                <p className="text-sm text-blue-600 font-medium">
                  Teacher Mode: Check in Students
                </p>
              </div>
              <p className="text-xs text-blue-500">
                Position the student in front of the camera. The system will
                automatically identify and check them in to any available
                session or create a general attendance record.
              </p>
            </div>
          </div>

          {/* Check-in Interface */}
          <div className="px-6 py-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              </div>
            )}

            {/* Face Recognition */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Student Face Recognition Check-in
              </h4>
              <FaceCapture
                onCapture={handleFaceCapture}
                onError={handleError}
                isLoading={isLoading}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
