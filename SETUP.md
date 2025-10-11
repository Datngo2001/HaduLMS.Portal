# HaduLMS Portal - Setup Instructions

This document provides step-by-step instructions to set up and run the Learning Management System.

## Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL database
- Git (for version control)

## Quick Setup

### 1. Install Dependencies

```bash
# Install root workspace dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

#### Backend Environment Setup

1. Copy the example environment file:
```bash
cd backend
copy .env.example .env
```

2. Update the `.env` file with your database configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hadu_lms?schema=public"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Other settings
NODE_ENV=development
PORT=3001
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
FRONTEND_URL=http://localhost:5173
```

#### Frontend Environment Setup

The frontend uses the default configuration in `.env`:
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 3. Database Setup

1. Create a PostgreSQL database named `hadu_lms`

2. Generate Prisma client:
```bash
cd backend
npx prisma generate
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Seed the database with sample data:
```bash
npx prisma db seed
```

### 4. Build and Start

#### Development Mode (Recommended)

Start both frontend and backend in development mode:
```bash
# From root directory
npm run dev
```

This will start:
- Backend API server on http://localhost:3001
- Frontend development server on http://localhost:5173

#### Production Mode

1. Build both applications:
```bash
npm run build
```

2. Start the production server:
```bash
npm run start
```

## Default User Accounts

After seeding the database, you can log in with these accounts:

| Role    | Email               | Password   |
|---------|---------------------|------------|
| Admin   | admin@hadu.edu      | admin123   |
| Teacher | teacher@hadu.edu    | teacher123 |
| Student | student@hadu.edu    | student123 |

## Available Scripts

### Root Level Scripts
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both applications for production
- `npm run start` - Start production server
- `npm run dev:frontend` - Start only frontend development server
- `npm run dev:backend` - Start only backend development server

### Backend Scripts
- `npm run dev` - Start backend in development mode
- `npm run build` - Build backend TypeScript code
- `npm run start` - Start production backend server
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio database viewer

### Frontend Scripts
- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build locally

## Project Structure

```
hadu-lms-portal/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── middleware/      # Authentication & validation middleware
│   │   ├── routes/          # API route handlers
│   │   ├── utils/           # Utility functions
│   │   └── index.ts         # Server entry point
│   ├── prisma/              # Database schema and migrations
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Database seeding script
│   └── package.json
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── contexts/        # React context providers
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service functions
│   │   └── main.tsx         # React entry point
│   └── package.json
├── package.json             # Root workspace configuration
└── README.md
```

## Features

### User Management
- Role-based authentication (Admin, Teacher, Student)
- JWT-based security
- User profile management

### Course Management
- Create, edit, and publish courses
- Course enrollment system
- Lesson management within courses
- File upload for course materials

### Dashboard & Analytics
- User-specific dashboards
- Course progress tracking
- Activity monitoring
- Statistics and metrics

### Responsive Design
- Mobile-friendly interface
- Modern UI with Tailwind CSS
- Accessible design patterns

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Courses
- `GET /api/courses` - List all published courses
- `POST /api/courses` - Create new course (Teacher/Admin)
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course (Teacher/Admin)
- `POST /api/courses/:id/enroll` - Enroll in course (Student)

### Lessons
- `GET /api/lessons/course/:courseId` - Get lessons for a course
- `POST /api/lessons` - Create new lesson (Teacher/Admin)
- `PUT /api/lessons/:id` - Update lesson (Teacher/Admin)
- `DELETE /api/lessons/:id` - Delete lesson (Teacher/Admin)

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/enrollments` - Get user's enrollments
- `GET /api/users/courses` - Get user's created courses (Teacher/Admin)

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Ensure database exists

2. **JWT_SECRET Error**
   - Make sure JWT_SECRET is set in backend .env file
   - Use a strong, unique secret for production

3. **Port Already in Use**
   - Change PORT in backend .env file
   - Update VITE_API_BASE_URL in frontend .env accordingly

4. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

### Development Tips

- Use `npx prisma studio` to view and edit database records
- Check browser console for frontend errors
- Monitor backend logs for API issues
- Use `npm run db:seed` to reset database with sample data

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in backend environment
2. Use a strong JWT_SECRET
3. Configure proper database connection string
4. Set up environment variables on your hosting platform
5. Build applications: `npm run build`
6. Deploy backend to your server (e.g., Heroku, DigitalOcean)
7. Deploy frontend to static hosting (e.g., Vercel, Netlify)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure builds pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.