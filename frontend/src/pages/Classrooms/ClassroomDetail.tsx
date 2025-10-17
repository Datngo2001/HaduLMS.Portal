import {
  ArrowLeft,
  Calendar,
  Edit,
  MapPin,
  Trash2,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  classroomAPI,
  type Classroom,
  type User,
} from "../../services/classrooms";

const ClassroomDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchClassroomDetail();
    }
  }, [id]);

  const fetchClassroomDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await classroomAPI.getClassroom(id);
      setClassroom(data);
    } catch (err: any) {
      console.error("Error fetching classroom:", err);
      setError(
        err.response?.data?.error || "Failed to fetch classroom details"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStudents = async () => {
    if (!id) return;

    try {
      const students = await classroomAPI.getAvailableStudents(id);
      setAvailableStudents(students);
    } catch (err: any) {
      console.error("Error fetching available students:", err);
    }
  };

  const handleDelete = async () => {
    if (!classroom || !id) return;

    if (
      !window.confirm(
        `Are you sure you want to delete classroom "${classroom.name}"?`
      )
    ) {
      return;
    }

    try {
      await classroomAPI.deleteClassroom(id);
      navigate("/classrooms");
    } catch (err: any) {
      console.error("Error deleting classroom:", err);
      alert(err.response?.data?.error || "Failed to delete classroom");
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!classroom || !id) return;

    const student = classroom.students?.find((s) => s.id === studentId);
    if (
      !window.confirm(
        `Are you sure you want to remove ${student?.firstName} ${student?.lastName} from this classroom?`
      )
    ) {
      return;
    }

    try {
      await classroomAPI.removeStudent(id, studentId);
      fetchClassroomDetail();
    } catch (err: any) {
      console.error("Error removing student:", err);
      alert(err.response?.data?.error || "Failed to remove student");
    }
  };

  const handleAssignStudents = async () => {
    if (!id || selectedStudents.length === 0) return;

    try {
      setAssignLoading(true);
      await classroomAPI.assignStudents(id, { studentIds: selectedStudents });
      setShowAssignModal(false);
      setSelectedStudents([]);
      fetchClassroomDetail();
    } catch (err: any) {
      console.error("Error assigning students:", err);
      alert(err.response?.data?.error || "Failed to assign students");
    } finally {
      setAssignLoading(false);
    }
  };

  const openAssignModal = () => {
    setShowAssignModal(true);
    fetchAvailableStudents();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || "Classroom not found"}
        </div>
        <div className="mt-4">
          <Link
            to="/classrooms"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classrooms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              to="/classrooms"
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {classroom.name}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Classroom details and student management
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to={`/classrooms/${classroom.id}/edit`}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md shadow-sm hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Classroom Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPin className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Location
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {classroom.location || "Not specified"}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Capacity
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {classroom.capacity || "Unlimited"}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Status
                  </dt>
                  <dd className="text-lg font-medium">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        classroom.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {classroom.isActive ? "Active" : "Inactive"}
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Students ({classroom.students?.length || 0})
            </h3>
            <button
              onClick={openAssignModal}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Students
            </button>
          </div>

          {classroom.students && classroom.students.length > 0 ? (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classroom.students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            student.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {student.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleRemoveStudent(student.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Remove student"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No students assigned
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by assigning students to this classroom.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Students Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Students
              </h3>

              {availableStudents.length > 0 ? (
                <div className="max-h-60 overflow-y-auto">
                  {availableStudents.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center p-2 hover:bg-gray-50 rounded"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents([
                              ...selectedStudents,
                              student.id,
                            ]);
                          } else {
                            setSelectedStudents(
                              selectedStudents.filter((id) => id !== student.id)
                            );
                          }
                        }}
                      />
                      <span className="ml-2 text-sm text-gray-900">
                        {student.firstName} {student.lastName}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-4">
                  No available students to assign.
                </p>
              )}

              <div className="flex items-center justify-end space-x-2 mt-4">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedStudents([]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignStudents}
                  disabled={selectedStudents.length === 0 || assignLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assignLoading
                    ? "Assigning..."
                    : `Assign ${selectedStudents.length} Student${
                        selectedStudents.length !== 1 ? "s" : ""
                      }`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomDetail;
