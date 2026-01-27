import os
import pickle
import logging
from typing import Optional
from azure.storage.blob import BlobServiceClient, ContainerClient
from azure.core.exceptions import ResourceNotFoundError, AzureError
from azure.identity import DefaultAzureCredential, ManagedIdentityCredential
import numpy as np

logger = logging.getLogger(__name__)

class BlobStorageService:
    """Service for managing face encodings in Azure Blob Storage."""
    
    def __init__(self, container_name: str, connection_string: Optional[str] = None, resource_endpoint: Optional[str] = None, client_id: Optional[str] = None):
        """
        Initialize the Blob Storage Service.
        Prioritizes managed identity authentication over connection string.
        
        Args:
            container_name: Name of the blob container
            connection_string: Azure Storage connection string (optional, fallback)
            resource_endpoint: Azure Storage resource endpoint for managed identity (optional)
            client_id: Client ID for user-assigned managed identity (optional)
        """
        self.container_name = container_name
        self.connection_string = connection_string
        self.resource_endpoint = resource_endpoint
        self.client_id = client_id
        self.blob_service_client = None
        self.container_client = None
        
        try:
            self._initialize_storage()
            logger.info(f"BlobStorageService initialized with container: {container_name}")
        except Exception as e:
            logger.error(f"Failed to initialize BlobStorageService: {str(e)}")
            raise
    
    def _initialize_storage(self):
        """Initialize blob service and create container if it doesn't exist.
        Prioritizes managed identity over connection string."""
        try:
            # Try managed identity first
            if self.resource_endpoint:
                try:
                    logger.info("Attempting to authenticate using managed identity...")
                    # Use user-assigned managed identity if client_id is provided
                    if self.client_id:
                        logger.info(f"Using user-assigned managed identity with client ID: {self.client_id}")
                        credential = ManagedIdentityCredential(client_id=self.client_id)
                    else:
                        logger.info("Using DefaultAzureCredential for authentication")
                        credential = DefaultAzureCredential()
                    account_url = self.resource_endpoint
                    
                    self.blob_service_client = BlobServiceClient(
                        account_url=account_url,
                        credential=credential
                    )
                    
                    # Test the connection by attempting to get container properties
                    self.container_client = self.blob_service_client.get_container_client(
                        self.container_name
                    )
                    
                    # Verify authentication works
                    try:
                        self.container_client.get_container_properties()
                        logger.info(f"Successfully authenticated using managed identity for endpoint: {self.resource_endpoint}")
                    except ResourceNotFoundError:
                        # Container doesn't exist yet, try to create it
                        self.container_client.create_container()
                        logger.info(f"Created container using managed identity: {self.container_name}")
                    
                    return  # Successfully initialized with managed identity
                    
                except Exception as e:
                    logger.warning(f"Managed identity authentication failed: {str(e)}")
                    if not self.connection_string:
                        raise  # No fallback available
                    logger.info("Falling back to connection string authentication...")
            
            # Fallback to connection string
            if self.connection_string:
                logger.info("Using connection string for authentication...")
                self.blob_service_client = BlobServiceClient.from_connection_string(
                    self.connection_string
                )
                
                # Get or create container
                self.container_client = self.blob_service_client.get_container_client(
                    self.container_name
                )
                
                # Try to create container if it doesn't exist
                try:
                    self.container_client.create_container()
                    logger.info(f"Created container: {self.container_name}")
                except Exception as e:
                    if "ContainerAlreadyExists" in str(e):
                        logger.info(f"Container already exists: {self.container_name}")
                    else:
                        logger.warning(f"Container creation warning: {str(e)}")
            else:
                raise ValueError("No authentication method available. Provide either resource_endpoint or connection_string.")
                    
        except Exception as e:
            logger.error(f"Error initializing storage: {str(e)}")
            raise
    
    def _get_blob_name(self, user_id: str) -> str:
        """Generate blob name for user's face encoding."""
        return f"{user_id}.pkl"
    
    def save_encoding(self, user_id: str, face_encoding: np.ndarray) -> bool:
        """
        Save face encoding to blob storage.
        
        Args:
            user_id: User identifier
            face_encoding: Face encoding array
            
        Returns:
            True if successful, False otherwise
        """
        try:
            blob_name = self._get_blob_name(user_id)
            blob_client = self.container_client.get_blob_client(blob_name)
            
            # Serialize the encoding
            encoding_data = pickle.dumps(face_encoding)
            
            # Upload to blob storage
            blob_client.upload_blob(encoding_data, overwrite=True)
            
            logger.info(f"Face encoding saved to blob storage for user: {user_id}")
            return True
            
        except AzureError as e:
            logger.error(f"Azure error saving encoding for user {user_id}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error saving encoding for user {user_id}: {str(e)}")
            return False
    
    def load_encoding(self, user_id: str) -> Optional[np.ndarray]:
        """
        Load face encoding from blob storage.
        
        Args:
            user_id: User identifier
            
        Returns:
            Face encoding array or None if not found
        """
        try:
            blob_name = self._get_blob_name(user_id)
            blob_client = self.container_client.get_blob_client(blob_name)
            
            # Download blob data
            blob_data = blob_client.download_blob().readall()
            
            # Deserialize the encoding
            face_encoding = pickle.loads(blob_data)
            
            return face_encoding
            
        except ResourceNotFoundError:
            logger.warning(f"Face encoding not found for user: {user_id}")
            return None
        except AzureError as e:
            logger.error(f"Azure error loading encoding for user {user_id}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error loading encoding for user {user_id}: {str(e)}")
            return None
    
    def delete_encoding(self, user_id: str) -> bool:
        """
        Delete face encoding from blob storage.
        
        Args:
            user_id: User identifier
            
        Returns:
            True if successful, False otherwise
        """
        try:
            blob_name = self._get_blob_name(user_id)
            blob_client = self.container_client.get_blob_client(blob_name)
            
            blob_client.delete_blob()
            
            logger.info(f"Face encoding deleted from blob storage for user: {user_id}")
            return True
            
        except ResourceNotFoundError:
            logger.warning(f"Face encoding not found for deletion: {user_id}")
            return False
        except AzureError as e:
            logger.error(f"Azure error deleting encoding for user {user_id}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error deleting encoding for user {user_id}: {str(e)}")
            return False
    
    def list_all_encodings(self) -> dict:
        """
        Load all face encodings from blob storage.
        
        Returns:
            Dictionary mapping user_id to face encoding
        """
        encodings = {}
        try:
            # List all blobs in the container
            blob_list = self.container_client.list_blobs()
            
            for blob in blob_list:
                if blob.name.endswith('.pkl'):
                    user_id = blob.name[:-4]  # Remove .pkl extension
                    encoding = self.load_encoding(user_id)
                    if encoding is not None:
                        encodings[user_id] = encoding
            
            logger.info(f"Loaded {len(encodings)} face encodings from blob storage")
            
        except AzureError as e:
            logger.error(f"Azure error listing encodings: {str(e)}")
        except Exception as e:
            logger.error(f"Error listing encodings: {str(e)}")
        
        return encodings
    
    def encoding_exists(self, user_id: str) -> bool:
        """
        Check if face encoding exists for user.
        
        Args:
            user_id: User identifier
            
        Returns:
            True if encoding exists, False otherwise
        """
        try:
            blob_name = self._get_blob_name(user_id)
            blob_client = self.container_client.get_blob_client(blob_name)
            
            return blob_client.exists()
            
        except Exception as e:
            logger.error(f"Error checking encoding existence for user {user_id}: {str(e)}")
            return False
