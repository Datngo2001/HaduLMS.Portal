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
import { useNavigate } from "react-router-dom";
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

const CheckIn: React.FC = () => {
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
    const fetchCurrentSession = async () => {
      try {
        const response = await api.get("/attendance/current-session");
        setSession(response.data.data);
      } catch (error: any) {
        // Don't treat no active session as an error since standalone check-ins are allowed
        console.log("No active session found, allowing standalone check-in");
        setSession(null);
      } finally {
        setIsLoadingSession(false);
      }
    };

    fetchCurrentSession();
  }, []);

  const handleFaceCapture = async (imageData: string) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/attendance/checkin", {
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
      const response = await api.post("/attendance/checkin/manual", {
        checkinCode: checkinCode.trim(),
      });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Looking for active sessions...</p>
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
            <p className="text-gray-600 mb-6">
              Welcome to {attendance.session.title}
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
                  <span className="text-sm font-medium">
                    {attendance.checkinMethod === "FACE_RECOGNITION"
                      ? "Face Recognition"
                      : "Manual Code"}
                  </span>
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
                Check In Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    // Show general check-in interface (no specific session)
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

            <h2 className="text-3xl font-extrabold text-gray-900">Check In</h2>
            <p className="mt-2 text-sm text-gray-600">Record your attendance</p>
          </div>

          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Info Banner */}
            <div className="bg-blue-50 px-6 py-4 border-b">
              <div className="text-center">
                <p className="text-sm text-blue-600 font-medium">
                  No active session found
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  You can still check in - your attendance will be recorded
                </p>
              </div>
            </div>

            {/* Check-in Methods */}
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
                  Face Recognition Check-in
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
            Session Check-in
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Check in to the active session below
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Session Info */}
          <div className="bg-blue-50 px-6 py-4 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">
                    {formatDate(session.startTime)}
                  </p>
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Active Session
                  </span>
                </div>
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
                    <div className="flex items-center text-blue-700">
                      <span className="w-4 h-4 mr-2 text-center">📚</span>
                      <span>{session.course.title}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Check-in Methods */}
          <div className="px-6 py-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Face Recognition */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Face Recognition Check-in
                </h4>
                <FaceCapture
                  onCapture={handleFaceCapture}
                  onError={handleError}
                  isLoading={isLoading}
                  disabled={isLoading}
                />
              </div>

              {/* Manual Check-in */}
              <div className="text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <QrCode className="w-5 h-5 mr-2" />
                  Manual Check-in
                </h4>

                {!showManualCheckin ? (
                  <button
                    onClick={() => setShowManualCheckin(true)}
                    className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Use Check-in Code Instead
                  </button>
                ) : (
                  <form onSubmit={handleManualCheckin} className="space-y-4">
                    <div>
                      <label
                        htmlFor="checkinCode"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Enter Check-in Code
                      </label>
                      <input
                        type="text"
                        id="checkinCode"
                        value={checkinCode}
                        onChange={(e) =>
                          setCheckinCode(e.target.value.toUpperCase())
                        }
                        placeholder="e.g. ABC123"
                        className="block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
                        disabled={isLoading}
                        maxLength={10}
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={isLoading || !checkinCode.trim()}
                        className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "Checking in..." : "Check In"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowManualCheckin(false);
                          setCheckinCode("");
                        }}
                        className="px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
