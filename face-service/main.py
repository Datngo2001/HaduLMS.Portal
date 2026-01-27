from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import logging
from dotenv import load_dotenv
import uvicorn

from face_recognition_service import FaceRecognitionService
from blob_storage_service import BlobStorageService

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO if os.getenv("DEBUG", "false").lower() == "true" else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="HaduLMS Face Recognition Service",
    description="Python-based face recognition service for attendance tracking",
    version="1.0.0"
)

# Add CORS middleware - restrict to backend only
allowed_hosts = os.getenv("ALLOWED_HOSTS", "localhost").split(",")
allowed_origins = [f"http://{host.strip()}:3001" for host in allowed_hosts] + ["http://localhost:3001"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Only allow backend
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],  # Restrict methods
    allow_headers=["Content-Type", "Authorization"],  # Restrict headers
)

# Initialize storage backend
storage_backend = None
use_blob_storage = os.getenv("USE_BLOB_STORAGE", "false").lower() == "true"

if use_blob_storage:
    try:
        storage_account_name = os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
        connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        container_name = os.getenv("AZURE_STORAGE_CONTAINER_NAME", "face-encodings")
        client_id = os.getenv("AZURE_CLIENT_ID")  # For user-assigned managed identity
        
        if storage_account_name or connection_string:
            storage_backend = BlobStorageService(
                container_name=container_name,
                connection_string=connection_string,
                storage_account_name=storage_account_name,
                client_id=client_id
            )
            auth_method = "user-assigned managed identity" if client_id else ("managed identity" if storage_account_name else "connection string")
            logger.info(f"Using Azure Blob Storage for face encodings (auth: {auth_method})")
        else:
            logger.warning("Blob storage enabled but no authentication method found. Using filesystem.")
    except Exception as e:
        logger.error(f"Failed to initialize blob storage: {str(e)}. Using filesystem.")

# Initialize face recognition service
face_service = FaceRecognitionService(
    face_encodings_dir=os.getenv("FACE_ENCODINGS_DIR", "./face_encodings"),
    confidence_threshold=float(os.getenv("CONFIDENCE_THRESHOLD", "0.6")),
    storage_backend=storage_backend
)

# Pydantic models
class RegisterFaceRequest(BaseModel):
    user_id: str
    image: str  # Base64 encoded image

class IdentifyFaceRequest(BaseModel):
    image: str  # Base64 encoded image

class RegisterFaceResponse(BaseModel):
    success: bool
    message: str
    user_id: Optional[str] = None

class IdentifyFaceResponse(BaseModel):
    success: bool
    user_id: Optional[str] = None
    confidence: Optional[float] = None
    message: str

class DeleteFaceResponse(BaseModel):
    success: bool
    message: str

class HealthResponse(BaseModel):
    status: str
    service: str
    registered_users_count: int

# API Endpoints

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    try:
        registered_users = face_service.get_registered_users()
        return HealthResponse(
            status="healthy",
            service="HaduLMS Face Recognition Service",
            registered_users_count=len(registered_users)
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Service unhealthy")

@app.post("/register-face", response_model=RegisterFaceResponse)
async def register_face(request: RegisterFaceRequest):
    """Register a user's face for recognition."""
    try:
        # Validate image format
        if not face_service.validate_image_format(request.image):
            raise HTTPException(
                status_code=400, 
                detail="Invalid image format. Please provide a valid base64 encoded image."
            )
        
        # Check if user already has a face registered
        if face_service._load_face_encoding(request.user_id) is not None:
            return RegisterFaceResponse(
                success=False,
                message="Face already registered for this user. Please delete the existing registration first.",
                user_id=request.user_id
            )
        
        # Register the face
        success = face_service.register_face(request.user_id, request.image)
        
        if success:
            return RegisterFaceResponse(
                success=True,
                message="Face registered successfully",
                user_id=request.user_id
            )
        else:
            raise HTTPException(status_code=400, detail="Failed to register face")
            
    except ValueError as e:
        logger.warning(f"Validation error in register_face: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in register_face: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/identify-face", response_model=IdentifyFaceResponse)
async def identify_face(request: IdentifyFaceRequest):
    """Identify a face from an image."""
    try:
        # Validate image format
        if not face_service.validate_image_format(request.image):
            raise HTTPException(
                status_code=400, 
                detail="Invalid image format. Please provide a valid base64 encoded image."
            )
        
        # Identify the face
        result = face_service.identify_face(request.image)
        
        if result:
            user_id, confidence = result
            return IdentifyFaceResponse(
                success=True,
                user_id=user_id,
                confidence=round(confidence, 3),
                message="Face identified successfully"
            )
        else:
            return IdentifyFaceResponse(
                success=False,
                message="No matching face found"
            )
            
    except ValueError as e:
        logger.warning(f"Validation error in identify_face: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in identify_face: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/delete-face/{user_id}", response_model=DeleteFaceResponse)
async def delete_face(user_id: str):
    """Delete a user's face data."""
    try:
        success = face_service.delete_face(user_id)
        
        if success:
            return DeleteFaceResponse(
                success=True,
                message="Face data deleted successfully"
            )
        else:
            return DeleteFaceResponse(
                success=False,
                message="No face data found for this user"
            )
            
    except Exception as e:
        logger.error(f"Error in delete_face: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/registered-users")
async def get_registered_users():
    """Get list of all users with registered faces."""
    try:
        users = face_service.get_registered_users()
        return {
            "success": True,
            "users": users,
            "count": len(users)
        }
    except Exception as e:
        logger.error(f"Error getting registered users: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    # Get configuration from environment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("SERVICE_PORT", "8001"))
    
    logger.info(f"Starting HaduLMS Face Recognition Service on {host}:{port}")
    
    uvicorn.run(
        app, 
        host=host, 
        port=port,
        log_level="info" if os.getenv("DEBUG", "false").lower() == "true" else "warning"
    )