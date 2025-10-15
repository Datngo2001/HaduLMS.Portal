# Python Face Recognition Service

A standalone Python service for face recognition attendance using OpenCV and face_recognition library.

## Features

- Face registration and storage
- Face identification for attendance
- RESTful API compatible with existing Node.js backend
- Local face encoding storage (no cloud dependency)
- High accuracy face recognition using dlib's state-of-the-art face recognition model

## Setup

### Prerequisites

- Python 3.8 or higher
- CMake (required for dlib)
- Visual Studio Build Tools (Windows)

### Installation

1. Install system dependencies:

```bash
# Windows (using chocolatey)
choco install cmake

# Or download and install from https://cmake.org/download/
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Configure environment variables in `.env`

### Running the Service

```bash
# Development
python main.py

# Production with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8001
```

## API Endpoints

### Register Face

- **POST** `/register-face`
- Register a user's face for recognition
- Body: `{"user_id": "string", "image": "base64_string"}`

### Identify Face

- **POST** `/identify-face`
- Identify a face from an image
- Body: `{"image": "base64_string"}`

### Delete Face

- **DELETE** `/delete-face/{user_id}`
- Delete a user's face data

### Health Check

- **GET** `/health`
- Service health status

## Integration with Node.js Backend

The Python service integrates seamlessly with the existing Node.js backend through RESTful API calls.

## Data Storage

Face encodings are stored locally in:

- `face_encodings/` - Directory containing user face encodings as pickle files
- Each user has a separate file: `{user_id}.pkl`

## Configuration

Environment variables:

- `SERVICE_PORT` - Port to run the service (default: 8001)
- `HOST` - Host to bind to (default: 0.0.0.0)
- `CONFIDENCE_THRESHOLD` - Face recognition confidence threshold (default: 0.6)
- `FACE_ENCODINGS_DIR` - Directory to store face encodings (default: ./face_encodings)
