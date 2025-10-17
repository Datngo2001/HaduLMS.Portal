import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  MapPin,
  QrCode,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FaceCapture from "../components/FaceCapture";
import { api } from "../services/_api";

interface Session {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  checkinCode?: string;
  classroom: {
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
}

interface Attendance {
  id: string;
  status: string;
  checkinTime: string;
  checkinMethod: string;
  confidence?: number;
  session: {
    title: string;
    classroom: {
      name: string;
    };
  };
}

const ClassroomCheckin: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showManualCheckin, setShowManualCheckin] = useState(false);
  const [checkinCode, setCheckinCode] = useState("");

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;

      try {
        const response = await api.get(`/attendance/sessions/${sessionId}`);
        setSession(response.data.data);
      } catch (error: any) {
        setError(
          error.response?.data?.error || "Session not found or inactive"
        );
      } finally {
        setIsLoadingSession(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  const handleFaceCapture = async (imageData: string) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post(`/attendance/checkin/${sessionId}`, {
        image: imageData,
      });

      setAttendance(response.data.data);
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

  const handleManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinCode.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await api.post(
        `/attendance/checkin/${sessionId}/manual`,
        {
          checkinCode: checkinCode.trim(),
        }
      );

      setAttendance(response.data.data);
      setSuccess(true);
    } catch (error: any) {
      console.error("Manual check-in error:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Invalid check-in code. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (error: string) => {
    setError(error);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session details...</p>
        </div>
      </div>
    );
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
              Check-in Successful!
            </h2>
            <p className="text-gray-600 mb-6">Welcome to {session?.title}</p>

            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Session:</span>
                  <span className="text-sm font-medium">{session?.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Classroom:</span>
                  <span className="text-sm font-medium">
                    {session?.classroom.name}
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
                  <span className="text-sm font-medium">
                    {attendance.checkinMethod === "FACE_RECOGNITION"
                      ? "Face Recognition"
                      : "Manual Code"}
                  </span>
                </div>
                {attendance.confidence && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Confidence:</span>
                    <span className="text-sm font-medium">
                      {Math.round(attendance.confidence * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Session Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error ||
              "The requested session could not be found or is no longer active."}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Dashboard
          </button>
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
            Classroom Check-in
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Verify your attendance for the session
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Session Info */}
          <div className="bg-blue-50 px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              {session.title}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center text-blue-700">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{session.classroom.name}</span>
                {session.classroom.location && (
                  <span className="ml-1 text-blue-600">
                    ({session.classroom.location})
                  </span>
                )}
              </div>

              <div className="flex items-center text-blue-700">
                <Clock className="w-4 h-4 mr-2" />
                <span>
                  {formatTime(session.startTime)} -{" "}
                  {formatTime(session.endTime)}
                </span>
              </div>

              <div className="flex items-center text-blue-700">
                <User className="w-4 h-4 mr-2" />
                <span>
                  {session.teacher.firstName} {session.teacher.lastName}
                </span>
              </div>

              {session.course && (
                <div className="text-blue-700">
                  <span className="font-medium">Course:</span>{" "}
                  {session.course.title}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      Check-in Failed
                    </h3>
                    <div className="mt-1 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Check-in Options */}
            <div className="space-y-6">
              {!showManualCheckin ? (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Face Recognition Check-in
                    </h3>
                    <p className="text-sm text-gray-600">
                      Use your registered face for quick check-in
                    </p>
                  </div>

                  <FaceCapture
                    onCapture={handleFaceCapture}
                    onError={handleError}
                    isLoading={isLoading}
                  />

                  <div className="text-center">
                    <button
                      onClick={() => setShowManualCheckin(true)}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      Use check-in code instead
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Manual Check-in
                    </h3>
                    <p className="text-sm text-gray-600">
                      Enter the check-in code provided by your teacher
                    </p>
                  </div>

                  <form onSubmit={handleManualCheckin} className="space-y-4">
                    <div>
                      <label
                        htmlFor="checkinCode"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Check-in Code
                      </label>
                      <input
                        type="text"
                        id="checkinCode"
                        value={checkinCode}
                        onChange={(e) =>
                          setCheckinCode(e.target.value.toUpperCase())
                        }
                        placeholder="Enter 6-digit code"
                        className="block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono tracking-widest"
                        maxLength={6}
                        disabled={isLoading}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !checkinCode.trim()}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? "Checking in..." : "Check In"}
                    </button>
                  </form>

                  <div className="text-center">
                    <button
                      onClick={() => {
                        setShowManualCheckin(false);
                        setCheckinCode("");
                        setError("");
                      }}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      <User className="w-4 h-4 mr-1" />
                      Use face recognition instead
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassroomCheckin;
