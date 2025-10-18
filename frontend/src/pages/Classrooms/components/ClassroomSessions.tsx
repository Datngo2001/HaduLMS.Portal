import { Calendar, Clock, Eye } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  classroomAPI,
  type ClassroomSession,
} from "../../../services/classrooms";

interface ClassroomSessionsProps {
  classroomId: string;
  totalStudents: number;
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
};

const getSessionStatus = (startTime: string, endTime: string) => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start > now) return "upcoming";
  if (start <= now && end >= now) return "ongoing";
  return "completed";
};

const ClassroomSessions: React.FC<ClassroomSessionsProps> = ({
  classroomId,
  totalStudents,
}) => {
  const [sessions, setSessions] = useState<ClassroomSession[]>([]);
  const [sessionsPagination, setSessionsPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  });
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [classroomId, showUpcomingOnly]);

  const fetchSessions = async (page: number = 1) => {
    if (!classroomId) return;

    try {
      setSessionsLoading(true);
      const response = await classroomAPI.getClassroomSessions(classroomId, {
        page,
        limit: sessionsPagination.limit,
        upcoming: showUpcomingOnly,
      });
      setSessions(response.sessions);
      setSessionsPagination(response.pagination);
    } catch (err: any) {
      console.error("Error fetching sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Classroom Sessions
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUpcomingOnly(!showUpcomingOnly)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                showUpcomingOnly
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {showUpcomingOnly ? "Upcoming Only" : "All Sessions"}
            </button>
          </div>
        </div>

        {sessionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : sessions && sessions.length > 0 ? (
          <>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session / Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => {
                    const startTime = new Date(session.startTime);
                    const endTime = new Date(session.endTime);
                    const duration = Math.round(
                      (endTime.getTime() - startTime.getTime()) / (1000 * 60)
                    );
                    const status = getSessionStatus(
                      session.startTime,
                      session.endTime
                    );
                    const dateTime = formatDateTime(session.startTime);
                    const endDateTime = formatDateTime(session.endTime);

                    return (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {session.title}
                          </div>
                          {session.course && (
                            <div className="text-sm text-gray-500">
                              Course: {session.course.title}
                            </div>
                          )}
                          {session.teacher && (
                            <div className="text-sm text-gray-500">
                              Teacher: {session.teacher.firstName}{" "}
                              {session.teacher.lastName}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {dateTime.date}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {dateTime.time} - {endDateTime.time}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {duration} minutes
                          </div>
                          <div className="text-sm">
                            {status === "ongoing" && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Ongoing
                              </span>
                            )}
                            {status === "upcoming" && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Upcoming
                              </span>
                            )}
                            {status === "completed" && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                Completed
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {session._count?.attendances || 0} / {totalStudents}
                          </div>
                          <div className="text-sm text-gray-500">
                            students present
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/sessions/${session.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View session details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Sessions Pagination */}
            {sessionsPagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing{" "}
                  {(sessionsPagination.page - 1) * sessionsPagination.limit + 1}{" "}
                  to{" "}
                  {Math.min(
                    sessionsPagination.page * sessionsPagination.limit,
                    sessionsPagination.total
                  )}{" "}
                  of {sessionsPagination.total} sessions
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => fetchSessions(sessionsPagination.page - 1)}
                    disabled={sessionsPagination.page <= 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  {Array.from(
                    { length: sessionsPagination.totalPages },
                    (_, i) => i + 1
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() => fetchSessions(page)}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        page === sessionsPagination.page
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => fetchSessions(sessionsPagination.page + 1)}
                    disabled={
                      sessionsPagination.page >= sessionsPagination.totalPages
                    }
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No sessions found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {showUpcomingOnly
                ? "No upcoming sessions scheduled for this classroom."
                : "No sessions have been scheduled for this classroom."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomSessions;
