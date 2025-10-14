# Face Recognition Setup Guide for HaduLMS

## Overview

This guide will help you complete the setup of face recognition functionality for classroom check-ins in your HaduLMS project.

## 🚀 Implementation Status

✅ **Completed:**

- Database schema updated with face recognition and attendance models
- Backend API routes for face registration and check-in
- Frontend components for face capture and registration
- Frontend pages for face registration and classroom check-in
- Prisma migration applied successfully
- Required dependencies installed

## 📋 Next Steps to Complete Setup

### 1. Azure Face API Setup

1. **Create Azure Face API Resource:**

   ```bash
   # Using Azure CLI (if you have it installed)
   az cognitiveservices account create \
     --name hadu-lms-face-api \
     --resource-group your-resource-group \
     --kind Face \
     --sku F0 \
     --location eastus
   ```

   Or create manually in Azure Portal:

   - Go to Azure Portal → Create Resource → AI + Machine Learning → Face
   - Choose F0 (free tier) for testing
   - Note down the endpoint URL and API key

2. **Update Environment Variables:**
   Add these to your `backend/.env` file:
   ```env
   AZURE_FACE_API_KEY=your_actual_api_key
   AZURE_FACE_API_ENDPOINT=https://your-region.api.cognitive.microsoft.com/
   AZURE_FACE_PERSON_GROUP_ID=hadu_lms_students
   ```

### 2. Update Profile Page (Optional)

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

### 3. Teacher Dashboard for Session Management

Consider creating a teacher dashboard to:

- Create classroom sessions
- View attendance reports
- Generate check-in codes

### 4. Testing the Implementation

1. **Start the backend server:**

   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend server:**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Test the workflow:**
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

- Face patterns stored securely, not actual images
- Confidence scoring for recognition accuracy
- Backup manual check-in with codes
- Session time validation
- User authentication required
- Rate limiting on API endpoints

## 💰 Cost Estimation

For 1,000 students checking in 5 days/week:

- **Monthly API calls:** ~43,300 (including registration)
- **Cost:** ~$23-30/month after free tier
- **Annual cost:** ~$280

## 🛠️ Troubleshooting

### Common Issues:

1. **Camera not working:** Check browser permissions
2. **Face not recognized:** Ensure good lighting and clear face view
3. **API errors:** Verify Azure Face API credentials
4. **Database errors:** Ensure migration was successful

### Error Handling:

- Graceful fallback to manual check-in
- Clear error messages for users
- Logging for debugging

## 🔄 Next Steps for Production

1. **Add monitoring and logging**
2. **Implement bulk attendance import**
3. **Add attendance analytics**
4. **Create teacher dashboard**
5. **Add notification system**
6. **Implement attendance reports**

## 📧 Support

For issues with this implementation, check:

1. Backend logs for API errors
2. Browser console for frontend errors
3. Azure Face API quotas and usage
4. Database connection and migrations

The implementation is now ready for testing! 🎉
