# HaduLMS Portal

A comprehensive Learning Management System built with modern web technologies.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication
- **File Storage**: Local storage with multer

## Features

- User authentication and authorization (Admin, Teacher, Student roles)
- Course management (create, edit, delete courses)
- Lesson management within courses
- File upload for course materials
- Student enrollment system
- Progress tracking
- Responsive design

## Project Structure

```
hadu-lms-portal/
├── frontend/          # React application
├── backend/           # Node.js API server
├── package.json       # Root package.json for workspace management
└── README.md
```

## Quick Start

1. **Prerequisites**
   - Node.js 18+ and npm 9+
   - PostgreSQL database

2. **Installation**
   ```bash
   npm run setup
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env` in the backend folder
   - Update database connection string and JWT secret

4. **Database Setup**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Development**
   ```bash
   npm run dev
   ```

   This starts both frontend (http://localhost:5173) and backend (http://localhost:3001)

## Default Users

After seeding the database:

- **Admin**: admin@hadu.edu / admin123
- **Teacher**: teacher@hadu.edu / teacher123  
- **Student**: student@hadu.edu / student123

## API Documentation

The backend API provides the following endpoints:

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course (Admin/Teacher)
- `GET /api/courses/:id` - Get course details
- `POST /api/courses/:id/enroll` - Enroll in course (Student)
- `GET /api/users/profile` - Get user profile

## Development Commands

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both applications for production
- `npm run start` - Start production server
- `npm run dev:frontend` - Start only frontend
- `npm run dev:backend` - Start only backend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License