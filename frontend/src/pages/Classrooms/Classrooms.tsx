import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { debounce } from "../../services/_api";
import { classroomAPI, type Classroom } from "../../services/classrooms";

const Classrooms: React.FC = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<boolean | undefined>(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Debounced search function
  const debouncedSearch = debounce(
    async (searchTerm: string, active?: boolean, page: number = 1) => {
      try {
        setLoading(true);
        setError(null);
        const response = await classroomAPI.getClassrooms({
          page,
          limit: pagination.limit,
          search: searchTerm,
          isActive: active,
        });
        setClassrooms(response.classrooms);
        setPagination(response.pagination);
      } catch (err: any) {
        console.error("Error fetching classrooms:", err);
        setError(err.response?.data?.error || "Failed to fetch classrooms");
      } finally {
        setLoading(false);
      }
    },
    300
  );

  const fetchClassrooms = (page: number = 1) => {
    debouncedSearch(search, isActive, page);
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  useEffect(() => {
    fetchClassrooms(1); // Reset to first page when search/filter changes
  }, [search, isActive]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this classroom?")) {
      return;
    }

    try {
      await classroomAPI.deleteClassroom(id);
      fetchClassrooms(pagination.page);
    } catch (err: any) {
      console.error("Error deleting classroom:", err);
      alert(err.response?.data?.error || "Failed to delete classroom");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (active?: boolean) => {
    setIsActive(active);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    fetchClassrooms(page);
  };

  if (loading && classrooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Classrooms</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage classrooms and assign students to them.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/classrooms/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Classroom
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search classrooms..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleFilterChange(undefined)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              isActive === undefined
                ? "bg-indigo-100 text-indigo-800"
                : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange(true)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              isActive === true
                ? "bg-green-100 text-green-800"
                : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => handleFilterChange(false)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              isActive === false
                ? "bg-red-100 text-red-800"
                : "bg-white text-gray-700 border border-gray-300"
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Classrooms Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
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
                  {classrooms.map((classroom) => (
                    <tr key={classroom.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/classrooms/${classroom.id}`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                        >
                          {classroom.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {classroom.location || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {classroom.capacity || "Unlimited"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Users className="h-4 w-4 mr-1 text-gray-400" />
                          {classroom._count?.students || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            classroom.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {classroom.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/classrooms/${classroom.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Users className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/classrooms/${classroom.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(classroom.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-sm border rounded-md ${
                    page === pagination.page
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {classrooms.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No classrooms found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {search || isActive !== undefined
              ? "Try adjusting your search or filter criteria."
              : "Get started by creating a new classroom."}
          </p>
          {!search && isActive === undefined && (
            <div className="mt-6">
              <Link
                to="/classrooms/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Classroom
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Classrooms;
