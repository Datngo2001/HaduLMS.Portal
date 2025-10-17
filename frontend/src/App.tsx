import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import { useAuth } from "./contexts/AuthContext";
import ClassroomCheckin from "./pages/ClassroomCheckin";
import ClassroomDetail from "./pages/Classrooms/ClassroomDetail";
import Classrooms from "./pages/Classrooms/Classrooms";
import CreateClassroom from "./pages/Classrooms/CreateClassroom";
import EditClassroom from "./pages/Classrooms/EditClassroom";
import CourseDetail from "./pages/CourseDetail";
import Courses from "./pages/Courses";
import Dashboard from "./pages/Dashboard";
import FaceRegistration from "./pages/FaceRegistration";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Users from "./pages/Users";

const App: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/users" element={<Users />} />
        <Route path="/classrooms" element={<Classrooms />} />
        <Route path="/classrooms/new" element={<CreateClassroom />} />
        <Route path="/classrooms/:id" element={<ClassroomDetail />} />
        <Route path="/classrooms/:id/edit" element={<EditClassroom />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/face-registration" element={<FaceRegistration />} />
        <Route path="/checkin/:sessionId" element={<ClassroomCheckin />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
