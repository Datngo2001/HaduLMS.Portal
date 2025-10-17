import { AlertCircle, ArrowLeft, CheckCircle, User } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FaceCapture from "../components/FaceCapture";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/_api";

const FaceRegistration: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleFaceCapture = async (imageData: string) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/attendance/register-face", {
        image: imageData,
      });

      setSuccess(true);

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        navigate("/profile");
      }, 3000);
    } catch (error: any) {
      console.error("Face registration error:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Failed to register face. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (error: string) => {
    setError(error);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Registration Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Your face has been registered successfully. You can now use face
              recognition for classroom check-ins.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <div className="text-left">
                  <h3 className="text-sm font-medium text-green-800">
                    What's Next?
                  </h3>
                  <div className="mt-1 text-sm text-green-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        Look for classroom sessions with face recognition
                        enabled
                      </li>
                      <li>Use the check-in feature when attending classes</li>
                      <li>Your attendance will be automatically recorded</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/profile")}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Go to Profile
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Back to Dashboard
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
            onClick={handleGoBack}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <User className="h-8 w-8 text-blue-600" />
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900">
            Register Your Face
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Set up face recognition for quick and secure classroom check-ins
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Registration Failed
                  </h3>
                  <div className="mt-1 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* User Info */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Registering face for:
            </h3>
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-2 mr-3">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Important Information */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Important Information
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your face data is securely stored and encrypted</li>
              <li>• Only face patterns are stored, not actual photos</li>
              <li>• You can delete your face data anytime from your profile</li>
              <li>• This enables quick check-in for classroom attendance</li>
              <li>• Backup check-in methods are always available</li>
            </ul>
          </div>

          {/* Face Capture Component */}
          <FaceCapture
            onCapture={handleFaceCapture}
            onError={handleError}
            isLoading={isLoading}
          />

          {/* Privacy Notice */}
          <div className="mt-6 text-xs text-gray-500 text-center">
            <p>
              By registering your face, you agree to our privacy policy
              regarding biometric data storage. Your data is processed securely
              and only used for attendance verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceRegistration;
