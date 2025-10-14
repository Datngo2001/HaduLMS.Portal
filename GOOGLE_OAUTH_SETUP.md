# Google OAuth Setup Guide

This guide will help you set up Google OAuth for the HaduLMS Portal.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Access to the Google Cloud Console

## Step 1: Create a Google Cloud Project (if you don't have one)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a project" dropdown
3. Click "New Project"
4. Enter a project name (e.g., "HaduLMS Portal")
5. Click "Create"

## Step 2: Enable the Google+ API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on "Google+ API" and then click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:

   - Choose "External" (unless you have a Google Workspace account)
   - Fill in the required fields:
     - Application name: "HaduLMS Portal"
     - User support email: Your email
     - Developer contact email: Your email
   - Add scopes: email, profile, openid
   - Save and continue through the remaining steps

4. After setting up the consent screen, create the OAuth client ID:

   - Application type: "Web application"
   - Name: "HaduLMS Portal Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - Add your production domain when deploying
   - Authorized redirect URIs:
     - `http://localhost:5173` (for development)
     - Add your production domain when deploying

5. Click "Create"
6. Copy the "Client ID" (you'll need this for your environment variables)

## Step 4: Configure Environment Variables

### Backend Configuration

1. Copy `backend/.env.example` to `backend/.env`
2. Update the `GOOGLE_CLIENT_ID` with your Google OAuth Client ID:
   ```
   GOOGLE_CLIENT_ID=your_actual_google_client_id_here
   ```

### Frontend Configuration

1. Copy `frontend/.env.example` to `frontend/.env`
2. Update the `VITE_GOOGLE_CLIENT_ID` with your Google OAuth Client ID:
   ```
   VITE_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
   ```

## Step 5: Test the Integration

1. Start the backend server:

   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend server:

   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to the login page (`http://localhost:5173`)
4. You should see a "Continue with Google" button
5. Click it and test the Google OAuth flow

## Security Notes

- Never commit your actual OAuth credentials to version control
- Use different OAuth clients for development and production
- Regularly rotate your OAuth credentials
- Review and limit the OAuth scopes to only what's necessary

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**:

   - Ensure your redirect URIs in the Google Cloud Console match exactly with your application URLs
   - Check for trailing slashes and http vs https

2. **"invalid_client" error**:

   - Verify your Client ID is correct in both backend and frontend environment variables
   - Ensure the Client ID corresponds to a web application type OAuth client

3. **User creation fails**:
   - Check your database connection
   - Verify that the User model in Prisma allows for empty passwords
   - Check server logs for detailed error messages

## Production Deployment

When deploying to production:

1. Create a new OAuth client ID for your production domain
2. Update the authorized origins and redirect URIs to include your production URL
3. Update your production environment variables with the production Client ID
4. Ensure HTTPS is enabled for your production domain (Google OAuth requires HTTPS in production)
