import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Search,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FaceCapture from "../components/FaceCapture";
import { useAuth } from "../contexts/AuthContext";
import {
  Classroom,
  classroomAPI,
  User as StudentUser,
} from "../services/classrooms";
import { faceRegistrationAPI } from "../services/faceRegistration";

const TeacherFaceRegistration: React.FC = () => {
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(
    null
  );
  const [selectedStudent, setSelectedStudent] = useState<StudentUser | null>(
    null
  );
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [currentStep, setCurrentStep] = useState<
    "classroom" | "student" | "capture"
  >("classroom");

  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user is teacher
  useEffect(() => {
    if (user && user.role !== "TEACHER" && user.role !== "ADMIN") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Load classrooms on component mount
  useEffect(() => {
    loadClassrooms();
  }, []);

  // Load students when classroom is selected
  useEffect(() => {
    if (selectedClassroom) {
      loadStudents();
    }
  }, [selectedClassroom, searchQuery]);

  const loadClassrooms = async () => {
    setIsLoadingClassrooms(true);
    try {
      const response = await classroomAPI.getClassrooms({
        limit: 100,
        isActive: true,
      });
      setClassrooms(response.classrooms);
    } catch (error) {
      console.error("Error loading classrooms:", error);
      setError("Failed to load classrooms");
    } finally {
      setIsLoadingClassrooms(false);
    }
  };

  const loadStudents = async () => {
    if (!selectedClassroom) return;

    setIsLoadingStudents(true);
    try {
      const response = await classroomAPI.searchStudentsInClassroom(
        selectedClassroom.id,
        {
          search: searchQuery,
          limit: 50,
        }
      );
      setStudents(response.students);
    } catch (error) {
      console.error("Error loading students:", error);
      setError("Failed to load students");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleClassroomSelect = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setSelectedStudent(null);
    setSearchQuery("");
    setCurrentStep("student");
  };

  const handleStudentSelect = (student: StudentUser) => {
    setSelectedStudent(student);
    setCurrentStep("capture");
  };

  const handleFaceCapture = async (imageData: string) => {
    if (!selectedStudent) return;

    setIsRegistering(true);
    setError("");

    try {
      await faceRegistrationAPI.registerStudentFace(
        selectedStudent.id,
        imageData
      );

      // Show temporary success message and go back to student selection
      setRegistrationCount((prev) => prev + 1);
      setSuccess(true);

      // After 2 seconds, reset to student selection step
      setTimeout(() => {
        setSuccess(false);
        setSelectedStudent(null);
        setCurrentStep("student");
        // Reload students to update face registration status
        loadStudents();
      }, 2000);
    } catch (error: any) {
      console.error("Face registration error:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Failed to register face. Please try again.";
      setError(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleError = (error: string) => {
    setError(error);
  };

  const handleGoBack = () => {
    if (currentStep === "capture") {
      setCurrentStep("student");
      setSelectedStudent(null);
    } else if (currentStep === "student") {
      setCurrentStep("classroom");
      setSelectedClassroom(null);
      setStudents([]);
    } else {
      navigate(-1);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Success Overlay */}
      {success && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-2xl">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Registration Successful!
            </h3>
            <p className="text-gray-600 mb-2">
              Face registered for{" "}
              <span className="font-semibold">
                {selectedStudent?.firstName} {selectedStudent?.lastName}
              </span>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800 font-medium">
                {registrationCount} student{registrationCount !== 1 ? "s" : ""}{" "}
                registered in this session
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Returning to student selection...
            </p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {currentStep === "classroom"
              ? "Back"
              : currentStep === "student"
              ? "Back to Classrooms"
              : "Back to Students"}
          </button>

          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <UserCheck className="h-8 w-8 text-blue-600" />
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900">
            Register Student Face
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Select a classroom and student to set up face recognition
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep === "classroom"
                    ? "bg-blue-600 text-white"
                    : selectedClassroom
                    ? "bg-green-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                <Users className="w-4 h-4" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">
                Select Classroom
              </span>
            </div>
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep === "student"
                    ? "bg-blue-600 text-white"
                    : selectedStudent
                    ? "bg-green-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                <User className="w-4 h-4" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">
                Select Student
              </span>
            </div>
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep === "capture"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700">
                Capture Face
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-1 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Classroom Selection */}
          {currentStep === "classroom" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Select a Classroom
              </h3>
              {isLoadingClassrooms ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">
                    Loading classrooms...
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {classrooms.map((classroom) => (
                    <div
                      key={classroom.id}
                      onClick={() => handleClassroomSelect(classroom)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all duration-200"
                    >
                      <h4 className="font-medium text-gray-900">
                        {classroom.name}
                      </h4>
                      {classroom.location && (
                        <p className="text-sm text-gray-600">
                          {classroom.location}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        {classroom._count?.students || 0} students
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Student Selection */}
          {currentStep === "student" && selectedClassroom && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Select a Student from {selectedClassroom.name}
              </h3>

              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {isLoadingStudents ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">
                    Loading students...
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => handleStudentSelect(student)}
                      className={`border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all duration-200 ${
                        student.faceId ? "bg-green-50 border-green-200" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-gray-100 rounded-full p-2 mr-3">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {student.email}
                            </p>
                            {student.phone && (
                              <p className="text-sm text-gray-500">
                                {student.phone}
                              </p>
                            )}
                          </div>
                        </div>
                        {student.faceId && (
                          <div className="flex items-center text-orange-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">
                              Face Registered (will be replaced)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {students.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {searchQuery
                        ? "No students found matching your search"
                        : "No students in this classroom"}
                    </div>
                  )}
                </div>
              )}

              {/* Finish Button */}
              <div className="mt-6 text-center">
                {registrationCount > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-green-800 font-medium">
                      ✓ {registrationCount} student
                      {registrationCount !== 1 ? "s" : ""} registered
                      successfully
                    </p>
                  </div>
                )}
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                  Finish Registration
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Click "Finish" when you're done registering students
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Face Capture */}
          {currentStep === "capture" && selectedStudent && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Register Face for {selectedStudent.firstName}{" "}
                {selectedStudent.lastName}
              </h3>

              {/* Student Info */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Student Information:
                </h4>
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedStudent.email}
                    </p>
                    {selectedStudent.phone && (
                      <p className="text-xs text-gray-500">
                        {selectedStudent.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Face Capture Component */}
              <FaceCapture
                onCapture={handleFaceCapture}
                onError={handleError}
                isLoading={isRegistering}
              />

              {/* Important Information */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Important Information
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Face data is securely stored and encrypted</li>
                  <li>• Only face patterns are stored, not actual photos</li>
                  <li>
                    • Students can delete their face data from their profile
                  </li>
                  <li>
                    • This enables quick check-in for classroom attendance
                  </li>
                  <li>• Backup check-in methods are always available</li>
                  <li>
                    • If a student already has face data, it will be replaced
                    with the new registration
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherFaceRegistration;
