import React from 'react';

const CourseDetail: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Course Details</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Introduction to TypeScript</h2>
        <p className="text-gray-600 mb-6">
          Learn the fundamentals of TypeScript programming language.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Course Info</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>Duration: 12 lessons</li>
              <li>Students: 45 enrolled</li>
              <li>Price: Free</li>
              <li>Instructor: John Teacher</li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-medium text-gray-900 mb-2">Lessons</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm">1. What is TypeScript?</span>
                <span className="text-xs text-gray-500">15 min</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm">2. Setting up TypeScript</span>
                <span className="text-xs text-gray-500">20 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;