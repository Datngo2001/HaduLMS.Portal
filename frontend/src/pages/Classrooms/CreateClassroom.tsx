import { ArrowLeft, Save } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  classroomAPI,
  type CreateClassroomRequest,
} from "../../services/classrooms";

const CreateClassroom: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateClassroomRequest>({
    name: "",
    location: "",
    capacity: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "capacity") {
      // Handle capacity as number or undefined if empty
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? undefined : parseInt(value, 10),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Classroom name is required");
      return;
    }

    if (formData.capacity !== undefined && formData.capacity <= 0) {
      setError("Capacity must be a positive number");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Clean up form data - remove empty strings and convert to undefined
      const cleanedData: CreateClassroomRequest = {
        name: formData.name.trim(),
        location: formData.location?.trim() || undefined,
        capacity: formData.capacity,
      };

      await classroomAPI.createClassroom(cleanedData);
      navigate("/classrooms");
    } catch (err: any) {
      console.error("Error creating classroom:", err);
      setError(err.response?.data?.error || "Failed to create classroom");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/classrooms");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center">
          <button
            onClick={handleCancel}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Create New Classroom
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Add a new classroom to the system
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Classroom Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Classroom Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter classroom name (e.g., Room 101, Lab A)"
            />
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700"
            >
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter location (e.g., Building A, Floor 2)"
            />
          </div>

          {/* Capacity */}
          <div>
            <label
              htmlFor="capacity"
              className="block text-sm font-medium text-gray-700"
            >
              Capacity
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              min="1"
              value={formData.capacity || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter maximum number of students (optional)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Leave empty for unlimited capacity
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Classroom
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClassroom;
