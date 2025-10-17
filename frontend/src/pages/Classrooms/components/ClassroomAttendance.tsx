import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  User,
  Users,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  attendanceAPI,
  type AttendanceRecord,
  type ClassroomAttendanceOverview,
} from "../../../services/attendance";

interface ClassroomAttendanceProps {
  classroomId: string;
}

const ClassroomAttendance: React.FC<ClassroomAttendanceProps> = ({
  classroomId,
}) => {
  const [attendanceData, setAttendanceData] =
    useState<ClassroomAttendanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchAttendanceData();
  }, [classroomId]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await attendanceAPI.getClassroomAttendance(classroomId);
      setAttendanceData(data);
    } catch (err: any) {
      console.error("Error fetching attendance data:", err);
      setError(err.response?.data?.error || "Failed to fetch attendance data");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const getAttendanceRate = (present: number, total: number) => {
    return total > 0 ? Math.round((present / total) * 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-100 text-green-800";
      case "LATE":
        return "bg-yellow-100 text-yellow-800";
      case "ABSENT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "FACE_RECOGNITION":
      case "TEACHER_ASSISTED":
        return <User className="h-4 w-4" />;
      case "QR_CODE":
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error || !attendanceData) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <XCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Failed to load attendance data
          </h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchAttendanceData}
            className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Attendance Overview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">
                  Total Sessions
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {attendanceData.overallSummary.totalSessions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">
                  Total Attendances
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {attendanceData.overallSummary.totalAttendances}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">
                  Average Rate
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {attendanceData.overallSummary.averageAttendance}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-indigo-600">
                  Total Students
                </p>
                <p className="text-2xl font-bold text-indigo-900">
                  {attendanceData.totalStudents}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">
                  Standalone Check-ins
                </p>
                <p className="text-2xl font-bold text-yellow-900">
                  {attendanceData.overallSummary.standaloneAttendances}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Standalone Attendances */}
      {attendanceData.standaloneAttendances.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Standalone Check-ins (
              {attendanceData.standaloneAttendances.length})
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Check-ins that were not associated with any specific session
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-2">
              {attendanceData.standaloneAttendances.map(
                (attendance: AttendanceRecord) => (
                  <div
                    key={attendance.id}
                    className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-3">
                        {getMethodIcon(attendance.checkinMethod)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {attendance.user.firstName} {attendance.user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(attendance.checkinTime).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          attendance.status
                        )}`}
                      >
                        {attendance.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {attendance.checkinMethod.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Students */}
      {attendanceData.overallSummary.topStudents.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Top Attending Students
          </h3>

          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendances
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceData.overallSummary.topStudents.map(
                  (student, index) => (
                    <tr key={student.user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-700">
                                {index + 1}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.user.firstName} {student.user.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.attendanceCount} /{" "}
                        {attendanceData.overallSummary.totalSessions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${student.attendanceRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {Math.round(student.attendanceRate)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Session Attendance Details
          </h3>
        </div>

        {attendanceData.sessions.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {attendanceData.sessions.map((sessionData) => {
              const { date, time } = formatDateTime(
                sessionData.session.startTime
              );
              const attendanceRate = getAttendanceRate(
                sessionData.summary.present,
                attendanceData.totalStudents
              );

              return (
                <div key={sessionData.session.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">
                        {sessionData.session.title}
                      </h4>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="mr-4">{date}</span>
                        <Clock className="h-4 w-4 mr-1" />
                        <span className="mr-4">{time}</span>
                        {sessionData.session.course && (
                          <span className="text-indigo-600">
                            {sessionData.session.course.title}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Teacher: {sessionData.session.teacher.firstName}{" "}
                        {sessionData.session.teacher.lastName}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {sessionData.summary.total} /{" "}
                        {attendanceData.totalStudents}
                      </div>
                      <div className="text-sm text-gray-500">
                        {attendanceRate}% attendance
                      </div>
                      <button
                        onClick={() =>
                          setSelectedSessionId(
                            selectedSessionId === sessionData.session.id
                              ? null
                              : sessionData.session.id
                          )
                        }
                        className="mt-2 text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        {selectedSessionId === sessionData.session.id
                          ? "Hide Details"
                          : "View Details"}
                      </button>
                    </div>
                  </div>

                  {/* Session Summary */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {sessionData.summary.present}
                      </div>
                      <div className="text-xs text-gray-500">Present</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-600">
                        {sessionData.summary.late}
                      </div>
                      <div className="text-xs text-gray-500">Late</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {sessionData.summary.faceRecognition}
                      </div>
                      <div className="text-xs text-gray-500">
                        Face Recognition
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {sessionData.summary.manual}
                      </div>
                      <div className="text-xs text-gray-500">Manual</div>
                    </div>
                  </div>

                  {/* Detailed Attendance List */}
                  {selectedSessionId === sessionData.session.id && (
                    <div className="mt-4 border-t pt-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-3">
                        Attendance Details
                      </h5>
                      {sessionData.attendances.length > 0 ? (
                        <div className="space-y-2">
                          {sessionData.attendances.map(
                            (attendance: AttendanceRecord) => (
                              <div
                                key={attendance.id}
                                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 mr-3">
                                    {getMethodIcon(attendance.checkinMethod)}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {attendance.user.firstName}{" "}
                                      {attendance.user.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(
                                        attendance.checkinTime
                                      ).toLocaleTimeString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                      attendance.status
                                    )}`}
                                  >
                                    {attendance.status}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {attendance.checkinMethod.replace("_", " ")}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No attendance records for this session.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No sessions found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No sessions have been created for this classroom yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomAttendance;
