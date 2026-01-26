import os
import base64
import pickle
import numpy as np
import face_recognition
import cv2
from PIL import Image
from io import BytesIO
from typing import Optional, List, Tuple, Union
import logging

logger = logging.getLogger(__name__)

class FaceRecognitionService:
    def __init__(
        self, 
        face_encodings_dir: str = "./face_encodings", 
        confidence_threshold: float = 0.6,
        storage_backend = None  # BlobStorageService or None for filesystem
    ):
        self.face_encodings_dir = face_encodings_dir
        self.confidence_threshold = confidence_threshold
        self.storage_backend = storage_backend
        
        # Create face encodings directory if using filesystem
        if storage_backend is None:
            os.makedirs(face_encodings_dir, exist_ok=True)
            logger.info(f"FaceRecognitionService initialized with filesystem storage: {face_encodings_dir}")
        else:
            logger.info(f"FaceRecognitionService initialized with Azure Blob Storage")
    
    def _base64_to_image(self, base64_string: str) -> np.ndarray:
        """Convert base64 string to OpenCV image format."""
        try:
            # Remove data URL prefix if present
            if base64_string.startswith('data:image'):
                base64_string = base64_string.split(',')[1]
            
            # Decode base64 to bytes
            image_bytes = base64.b64decode(base64_string)
            
            # Convert to PIL Image
            pil_image = Image.open(BytesIO(image_bytes))
            
            # Convert to RGB if not already
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            # Convert to numpy array (OpenCV format)
            opencv_image = np.array(pil_image)
            
            return opencv_image
        except Exception as e:
            logger.error(f"Error converting base64 to image: {str(e)}")
            raise ValueError(f"Invalid image format: {str(e)}")
    
    def _get_face_encoding_path(self, user_id: str) -> str:
        """Get the file path for storing user's face encoding."""
        return os.path.join(self.face_encodings_dir, f"{user_id}.pkl")
    
    def _save_face_encoding(self, user_id: str, face_encoding: np.ndarray) -> None:
        """Save face encoding to storage backend."""
        try:
            if self.storage_backend:
                # Use blob storage
                self.storage_backend.save_encoding(user_id, face_encoding)
            else:
                # Use filesystem
                encoding_path = self._get_face_encoding_path(user_id)
                with open(encoding_path, 'wb') as f:
                    pickle.dump(face_encoding, f)
            logger.info(f"Face encoding saved for user: {user_id}")
        except Exception as e:
            logger.error(f"Error saving face encoding for user {user_id}: {str(e)}")
            raise
    
    def _load_face_encoding(self, user_id: str) -> Optional[np.ndarray]:
        """Load face encoding from storage backend."""
        try:
            if self.storage_backend:
                # Use blob storage
                return self.storage_backend.load_encoding(user_id)
            else:
                # Use filesystem
                encoding_path = self._get_face_encoding_path(user_id)
                if not os.path.exists(encoding_path):
                    return None
                
                with open(encoding_path, 'rb') as f:
                    face_encoding = pickle.load(f)
                return face_encoding
        except Exception as e:
            logger.error(f"Error loading face encoding for user {user_id}: {str(e)}")
            return None
    
    def _get_all_face_encodings(self) -> dict:
        """Load all face encodings from storage backend."""
        encodings = {}
        try:
            if self.storage_backend:
                # Use blob storage
                encodings = self.storage_backend.list_all_encodings()
            else:
                # Use filesystem
                for filename in os.listdir(self.face_encodings_dir):
                    if filename.endswith('.pkl'):
                        user_id = filename[:-4]  # Remove .pkl extension
                        encoding = self._load_face_encoding(user_id)
                        if encoding is not None:
                            encodings[user_id] = encoding
        except Exception as e:
            logger.error(f"Error loading all face encodings: {str(e)}")
        
        return encodings
    
    def register_face(self, user_id: str, image_base64: str) -> bool:
        """
        Register a user's face for recognition.
        
        Args:
            user_id: Unique identifier for the user
            image_base64: Base64 encoded image string
            
        Returns:
            bool: True if registration successful, False otherwise
            
        Raises:
            ValueError: If no face found in image or invalid image format
            Exception: If registration fails
        """
        try:
            # Check if user already has a face registered
            if self._load_face_encoding(user_id) is not None:
                logger.warning(f"User {user_id} already has a face registered")
                return False
            
            # Convert base64 to image
            image = self._base64_to_image(image_base64)
            
            # Find face locations
            face_locations = face_recognition.face_locations(image)
            
            if len(face_locations) == 0:
                raise ValueError("No face found in the image")
            
            if len(face_locations) > 1:
                logger.warning(f"Multiple faces found in image for user {user_id}, using the first one")
            
            # Get face encodings
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            if len(face_encodings) == 0:
                raise ValueError("Could not encode face from the image")
            
            # Use the first face encoding
            face_encoding = face_encodings[0]
            
            # Save the face encoding
            self._save_face_encoding(user_id, face_encoding)
            
            logger.info(f"Successfully registered face for user: {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error registering face for user {user_id}: {str(e)}")
            raise
    
    def identify_face(self, image_base64: str) -> Optional[Tuple[str, float]]:
        """
        Identify a face from an image.
        
        Args:
            image_base64: Base64 encoded image string
            
        Returns:
            Tuple[str, float]: (user_id, confidence) if face identified, None otherwise
            
        Raises:
            ValueError: If no face found in image or invalid image format
        """
        try:
            # Convert base64 to image
            image = self._base64_to_image(image_base64)
            
            # Find face locations
            face_locations = face_recognition.face_locations(image)
            
            if len(face_locations) == 0:
                logger.info("No face found in the identification image")
                return None
            
            # Get face encodings
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            if len(face_encodings) == 0:
                logger.info("Could not encode face from the identification image")
                return None
            
            # Use the first face encoding
            unknown_encoding = face_encodings[0]
            
            # Load all registered face encodings
            known_encodings = self._get_all_face_encodings()
            
            if not known_encodings:
                logger.info("No registered faces found")
                return None
            
            # Prepare known encodings and names
            known_face_encodings = list(known_encodings.values())
            known_face_names = list(known_encodings.keys())
            
            # Compare faces
            matches = face_recognition.compare_faces(
                known_face_encodings, 
                unknown_encoding, 
                tolerance=(1.0 - self.confidence_threshold)
            )
            
            # Calculate face distances
            face_distances = face_recognition.face_distance(known_face_encodings, unknown_encoding)
            
            # Find the best match
            best_match_index = np.argmin(face_distances)
            
            if matches[best_match_index]:
                user_id = known_face_names[best_match_index]
                # Convert distance to confidence (0-1, where 1 is perfect match)
                confidence = 1.0 - face_distances[best_match_index]
                
                logger.info(f"Face identified as user: {user_id} with confidence: {confidence:.3f}")
                return user_id, confidence
            
            logger.info("No matching face found")
            return None
            
        except Exception as e:
            logger.error(f"Error identifying face: {str(e)}")
            raise
    
    def delete_face(self, user_id: str) -> bool:
        """
        Delete a user's face data.
        
        Args:
            user_id: Unique identifier for the user
            
        Returns:
            bool: True if deletion successful, False if user not found
        """
        try:
            if self.storage_backend:
                # Use blob storage
                return self.storage_backend.delete_encoding(user_id)
            else:
                # Use filesystem
                encoding_path = self._get_face_encoding_path(user_id)
                
                if not os.path.exists(encoding_path):
                    logger.warning(f"No face data found for user: {user_id}")
                    return False
                
                os.remove(encoding_path)
                logger.info(f"Successfully deleted face data for user: {user_id}")
                return True
            
        except Exception as e:
            logger.error(f"Error deleting face data for user {user_id}: {str(e)}")
            raise
    
    def get_registered_users(self) -> List[str]:
        """Get list of all users with registered faces."""
        try:
            users = []
            for filename in os.listdir(self.face_encodings_dir):
                if filename.endswith('.pkl'):
                    user_id = filename[:-4]  # Remove .pkl extension
                    users.append(user_id)
            return users
        except Exception as e:
            logger.error(f"Error getting registered users: {str(e)}")
            return []
    
    def validate_image_format(self, base64_string: str) -> bool:
        """Validate if the base64 string is a valid image."""
        try:
            self._base64_to_image(base64_string)
            return True
        except:
            return False