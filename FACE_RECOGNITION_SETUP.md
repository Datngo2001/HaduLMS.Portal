# Face Recognition Setup Guide for HaduLMS

## Overview

This guide will help you complete the setup of face recognition functionality for classroom check-ins in your HaduLMS project using the Python-based face recognition service.

## 🚀 Implementation Status

✅ **Completed:**

- Database schema updated with face recognition and attendance models
- Backend API routes for face registration and check-in
- Frontend components for face capture and registration
- Frontend pages for face registration and classroom check-in
- Prisma migration applied successfully
- Required dependencies installed
- Python face recognition service implemented

## 📋 Setup Instructions

### 1. Python Face Recognition Service Setup

**Prerequisites:**

- Python 3.8 or higher
- CMake (for dlib compilation)
- Visual Studio Build Tools (Windows) or build-essential (Linux)

**Setup Steps:**

1. **Navigate to Python service directory:**

   ```bash
   cd face-service
   ```

2. **Run the automated setup:**

   ```bash
   # Windows
   setup-windows.bat

   # Linux/macOS
   python setup.py
   ```

3. **Start the Python service:**

   ```bash
   # Development
   python main.py

   # Or use the convenience script
   start-python-service.bat  # Windows
   ```

4. **Verify the service is running:**

   ```bash
   curl http://localhost:8001/health
   ```

   The service API documentation is available at: http://localhost:8001/docs

**Manual Setup (if automated setup fails):**

1. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Create environment file:**

   ```bash
   cp .env.example .env
   ```

3. **Start the service:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8001
   ```

### 2. Backend Configuration

The backend is already configured to use the Python face recognition service. Make sure your `backend/.env` file contains:

```env
PYTHON_FACE_SERVICE_URL=http://localhost:8001
```

### 3. Update Profile Page (Optional)

Add a link to face registration in your profile page:

```tsx
// In frontend/src/pages/Profile.tsx, add this button:
<Link
  to="/face-registration"
  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
>
  Register Face for Check-in
</Link>
```

### 4. Teacher Dashboard for Session Management

Consider creating a teacher dashboard to:

- Create classroom sessions
- View attendance reports
- Generate check-in codes

### 5. Testing the Implementation

1. **Start the Python service:**

   ```bash
   cd face-service
   python main.py
   ```

2. **Start the backend server:**

   ```bash
   cd backend
   npm run dev
   ```

3. **Start the frontend server:**

   ```bash
   cd frontend
   npm run dev
   ```

4. **Test the workflow:**
   - Register as a student
   - Go to `/face-registration` to register your face
   - Create a classroom session (you'll need to add this to teacher interface)
   - Use `/checkin/{sessionId}` to test face recognition check-in

## 🏗️ API Endpoints Added

### Face Registration

- `POST /api/attendance/register-face` - Register user's face
- `DELETE /api/attendance/register-face` - Delete user's face registration

### Session Management

- `POST /api/attendance/classrooms` - Create classroom
- `GET /api/attendance/classrooms` - List classrooms
- `POST /api/attendance/sessions` - Create session
- `GET /api/attendance/sessions` - List teacher's sessions
- `GET /api/attendance/sessions/:id` - Get session details

### Check-in

- `POST /api/attendance/checkin/:sessionId` - Face recognition check-in
- `POST /api/attendance/checkin/:sessionId/manual` - Manual check-in with code
- `GET /api/attendance/sessions/:sessionId/attendance` - View attendance (teachers)

## 🎨 Frontend Routes Added

- `/face-registration` - Register face for recognition
- `/checkin/:sessionId` - Classroom check-in page

## 💡 Usage Examples

### 1. Register Face (Student)

```typescript
// Students can register their face
const registerFace = async (imageBase64: string) => {
  const response = await api.post("/attendance/register-face", {
    image: imageBase64,
  });
};
```

### 2. Create Session (Teacher)

```typescript
// Teachers can create classroom sessions
const createSession = async () => {
  const response = await api.post("/attendance/sessions", {
    title: "Math 101 - Calculus",
    classroomId: "classroom_id",
    courseId: "course_id", // optional
    startTime: "2024-10-15T09:00:00Z",
    endTime: "2024-10-15T10:30:00Z",
  });
};
```

### 3. Check-in (Student)

```typescript
// Students can check-in using face recognition
const checkin = async (sessionId: string, imageBase64: string) => {
  const response = await api.post(`/attendance/checkin/${sessionId}`, {
    image: imageBase64,
  });
};
```

## 🔒 Security Features

- Face encodings stored locally, not actual images
- High accuracy face recognition using dlib models
- Backup manual check-in with codes
- Session time validation
- User authentication required
- Rate limiting on API endpoints
- No external API dependencies for face data

## 💰 Cost Estimation

Using the Python face recognition service:

- **Cost:** FREE (no external API costs)
- **Infrastructure:** Only your server hosting costs
- **Storage:** Minimal (face encodings are small files)
- **Scalability:** Scales with your server capacity

## 🛠️ Troubleshooting

### Common Issues:

1. **Camera not working:** Check browser permissions
2. **Face not recognized:** Ensure good lighting and clear face view
3. **Python service not starting:** Check if CMake and build tools are installed
4. **Service connection errors:** Verify Python service is running on port 8001
5. **Database errors:** Ensure migration was successful

### Python Service Issues:

1. **CMake not found:**

   ```bash
   # Windows
   choco install cmake

   # Linux
   sudo apt-get install cmake build-essential

   # macOS
   brew install cmake
   ```

2. **dlib compilation fails:** Install Visual Studio Build Tools (Windows) or build-essential (Linux)

3. **Service health check:**
   ```bash
   curl http://localhost:8001/health
   python test_service.py
   ```

### Error Handling:

- Graceful fallback to manual check-in
- Clear error messages for users
- Comprehensive logging for debugging

## 🔄 Next Steps for Production

1. **Add monitoring and logging**
2. **Implement bulk attendance import**
3. **Add attendance analytics**
4. **Create teacher dashboard**
5. **Add notification system**
6. **Implement attendance reports**
7. **Setup Docker deployment for Python service**
8. **Configure reverse proxy (nginx) for production**

## 📧 Support

For issues with this implementation, check:

1. Python service logs for face recognition errors
2. Backend logs for API errors
3. Browser console for frontend errors
4. Database connection and migrations
5. Python service health endpoint: http://localhost:8001/health

The implementation is now ready for testing! 🎉
