import axios from "axios";

export class PythonFaceRecognitionService {
  private serviceUrl: string;

  constructor() {
    this.serviceUrl =
      process.env.FACE_RECOGNITION_SERVICE_URL ||
      process.env.PYTHON_FACE_SERVICE_URL ||
      "http://localhost:8001";
  }

  private async makeRequest(endpoint: string, method: string, data?: any) {
    try {
      const config = {
        method,
        url: `${this.serviceUrl}${endpoint}`,
        headers: {
          "Content-Type": "application/json",
        },
        ...(data && { data }),
      };

      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      console.error(
        `Error calling Python service ${endpoint}:`,
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.detail ||
          `Failed to call Python face recognition service`
      );
    }
  }

  async registerUserFace(userId: string, imageBase64: string): Promise<string> {
    try {
      const response = await this.makeRequest("/register-face", "POST", {
        user_id: userId,
        image: imageBase64,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to register face");
      }

      // Return user_id as person_id for compatibility with existing code
      return response.user_id;
    } catch (error: any) {
      console.error("Face registration error:", error.message);
      throw error;
    }
  }

  async identifyFace(
    imageBase64: string
  ): Promise<{ userId: string; confidence: number } | null> {
    try {
      const response = await this.makeRequest("/identify-face", "POST", {
        image: imageBase64,
      });

      if (response.success && response.user_id) {
        return {
          userId: response.user_id,
          confidence: response.confidence,
        };
      }

      return null;
    } catch (error: any) {
      console.error("Face identification error:", error.message);
      throw error;
    }
  }

  async deleteUserFace(userId: string): Promise<void> {
    try {
      const response = await this.makeRequest(
        `/delete-face/${userId}`,
        "DELETE"
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to delete face");
      }
    } catch (error: any) {
      console.error("Face deletion error:", error.message);
      throw error;
    }
  }

  async getRegisteredUsers(): Promise<string[]> {
    try {
      const response = await this.makeRequest("/registered-users", "GET");
      return response.users || [];
    } catch (error: any) {
      console.error("Error getting registered users:", error.message);
      throw error;
    }
  }

  async checkServiceHealth(): Promise<boolean> {
    try {
      const response = await this.makeRequest("/health", "GET");
      return response.status === "healthy";
    } catch (error) {
      return false;
    }
  }

  // Compatibility methods to match existing interface
  async initializePersonGroup(): Promise<void> {
    // This is not needed for the Python service as it uses file-based storage
    // Just check if the service is healthy
    const isHealthy = await this.checkServiceHealth();
    if (!isHealthy) {
      throw new Error("Python face recognition service is not available");
    }
  }

  isValidImageFormat(base64: string): boolean {
    // Basic validation - the Python service will do more thorough validation
    const imageRegex = /^data:image\/(jpeg|jpg|png|gif|bmp);base64,/;
    return imageRegex.test(base64) || /^[A-Za-z0-9+/=]+$/.test(base64);
  }

  async compressImage(base64: string, quality: number = 0.8): Promise<string> {
    // For now, just return the original image
    // You can implement compression here if needed
    return base64;
  }
}
