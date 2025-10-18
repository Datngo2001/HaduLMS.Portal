import { AlertCircle, ArrowLeft, Users } from "lucide-react";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const FaceRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect students to teacher face registration, allow teachers/admins to proceed
  useEffect(() => {
    if (user?.role === "STUDENT") {
      navigate("/teacher-face-registration");
    }
  }, [user, navigate]);

  if (user?.role === "STUDENT") {
    return null; // Will be redirected
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <h2 className="text-3xl font-extrabold text-gray-900">
            Face Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Face registration is now managed by teachers
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <h3 className="text-lg font-medium text-blue-900">
                  Teacher-Managed Registration
                </h3>
                <p className="text-sm text-blue-700">
                  Student face registration is now handled by teachers
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    How Face Registration Works Now
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>
                      • Teachers register student faces using the teacher portal
                    </li>
                    <li>
                      • Students no longer need to register their own faces
                    </li>
                    <li>• Teachers can update face registrations as needed</li>
                    <li>
                      • Face check-in is handled by teachers during sessions
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-4">
                Need your face registered? Contact your teacher.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Dashboard
                </button>

                {(user?.role === "TEACHER" || user?.role === "ADMIN") && (
                  <button
                    onClick={() => navigate("/teacher-face-registration")}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Register Student Faces
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceRegistration;
