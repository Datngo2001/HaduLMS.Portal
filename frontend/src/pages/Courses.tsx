import React from 'react';

const Courses: React.FC = () => {
  const courses = [
    {
      id: '1',
      title: 'Introduction to TypeScript',
      description: 'Learn the fundamentals of TypeScript programming language.',
      instructor: 'John Teacher',
      students: 45,
      lessons: 12,
      price: 0,
    },
    {
      id: '2',
      title: 'React for Beginners',
      description: 'A comprehensive guide to building web applications with React.',
      instructor: 'John Teacher',
      students: 32,
      lessons: 8,
      price: 29.99,
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
          Create Course
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {course.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {course.description}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{course.students} students</span>
                <span>{course.lessons} lessons</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary-600">
                  {course.price === 0 ? 'Free' : `$${course.price}`}
                </span>
                <button className="bg-primary-100 text-primary-700 px-3 py-1 rounded text-sm hover:bg-primary-200">
                  View Course
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Courses;