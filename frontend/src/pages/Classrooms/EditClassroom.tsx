import { ArrowLeft, Save } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  classroomAPI,
  type Classroom,
  type UpdateClassroomRequest,
} from "../../services/classrooms";

const EditClassroom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [formData, setFormData] = useState<UpdateClassroomRequest>({
    name: "",
    location: "",
    capacity: undefined,
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchClassroom();
    }
  }, [id]);

  const fetchClassroom = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await classroomAPI.getClassroom(id);
      setClassroom(data);
      setFormData({
        name: data.name,
        location: data.location || "",
        capacity: data.capacity,
        isActive: data.isActive,
      });
    } catch (err: any) {
      console.error("Error fetching classroom:", err);
      setError(
        err.response?.data?.error || "Failed to fetch classroom details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (name === "capacity") {
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

    if (!id) return;

    if (!formData.name?.trim()) {
      setError("Classroom name is required");
      return;
    }

    if (formData.capacity !== undefined && formData.capacity <= 0) {
      setError("Capacity must be a positive number");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Clean up form data - remove empty strings and convert to undefined
      const cleanedData: UpdateClassroomRequest = {
        name: formData.name.trim(),
        location: formData.location?.trim() || undefined,
        capacity: formData.capacity,
        isActive: formData.isActive,
      };

      await classroomAPI.updateClassroom(id, cleanedData);
      navigate(`/classrooms/${id}`);
    } catch (err: any) {
      console.error("Error updating classroom:", err);
      setError(err.response?.data?.error || "Failed to update classroom");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/classrooms/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !classroom) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate("/classrooms")}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classrooms
          </button>
        </div>
      </div>
    );
  }

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
              Edit Classroom
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Update classroom information
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
              value={formData.name || ""}
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

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive || false}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isActive"
              className="ml-2 block text-sm text-gray-900"
            >
              Active classroom
            </label>
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
              disabled={saving}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClassroom;
