import axios from "axios";

export class FaceRecognitionService {
  private apiKey: string;
  private endpoint: string;
  private personGroupId: string;

  constructor() {
    this.apiKey = process.env.AZURE_FACE_API_KEY!;
    this.endpoint = process.env.AZURE_FACE_API_ENDPOINT!;
    this.personGroupId =
      process.env.AZURE_FACE_PERSON_GROUP_ID || "hadu_lms_students";

    if (!this.apiKey || !this.endpoint) {
      throw new Error("Azure Face API credentials are not configured");
    }
  }

  private getHeaders() {
    return {
      "Ocp-Apim-Subscription-Key": this.apiKey,
      "Content-Type": "application/json",
    };
  }

  private getBinaryHeaders() {
    return {
      "Ocp-Apim-Subscription-Key": this.apiKey,
      "Content-Type": "application/octet-stream",
    };
  }

  async initializePersonGroup() {
    try {
      await axios.put(
        `${this.endpoint}/face/v1.0/persongroups/${this.personGroupId}`,
        {
          name: "HaduLMS Students",
          userData: "Student face recognition group for HaduLMS",
        },
        { headers: this.getHeaders() }
      );
      console.log("Person group created successfully");
    } catch (error: any) {
      if (error.response?.status === 409) {
        console.log("Person group already exists");
      } else {
        console.error("Error creating person group:", error.response?.data);
        throw error;
      }
    }
  }

  async registerUserFace(userId: string, imageBase64: string): Promise<string> {
    try {
      // Ensure person group exists
      await this.initializePersonGroup();

      // Create person in person group
      const createPersonResponse = await axios.post(
        `${this.endpoint}/face/v1.0/persongroups/${this.personGroupId}/persons`,
        {
          name: userId,
          userData: `User ID: ${userId}`,
        },
        { headers: this.getHeaders() }
      );

      const personId = createPersonResponse.data.personId;

      // Convert base64 to buffer
      const imageBuffer = this.base64ToBuffer(imageBase64);

      // Add face to person
      await axios.post(
        `${this.endpoint}/face/v1.0/persongroups/${this.personGroupId}/persons/${personId}/persistedFaces`,
        imageBuffer,
        { headers: this.getBinaryHeaders() }
      );

      // Train person group
      await this.trainPersonGroup();

      return personId;
    } catch (error: any) {
      console.error(
        "Face registration error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to register face");
    }
  }

  async identifyFace(
    imageBase64: string
  ): Promise<{ userId: string; confidence: number } | null> {
    try {
      // Convert base64 to buffer
      const imageBuffer = this.base64ToBuffer(imageBase64);

      // Detect faces in image
      const detectResponse = await axios.post(
        `${this.endpoint}/face/v1.0/detect`,
        imageBuffer,
        { headers: this.getBinaryHeaders() }
      );

      if (detectResponse.data.length === 0) {
        return null; // No face detected
      }

      const faceId = detectResponse.data[0].faceId;

      // Identify face
      const identifyResponse = await axios.post(
        `${this.endpoint}/face/v1.0/identify`,
        {
          personGroupId: this.personGroupId,
          faceIds: [faceId],
          maxNumOfCandidatesReturned: 1,
          confidenceThreshold: 0.5,
        },
        { headers: this.getHeaders() }
      );

      if (identifyResponse.data[0]?.candidates?.length > 0) {
        const candidate = identifyResponse.data[0].candidates[0];

        // Get person info
        const personResponse = await axios.get(
          `${this.endpoint}/face/v1.0/persongroups/${this.personGroupId}/persons/${candidate.personId}`,
          { headers: this.getHeaders() }
        );

        return {
          userId: personResponse.data.name,
          confidence: candidate.confidence,
        };
      }

      return null;
    } catch (error: any) {
      console.error(
        "Face identification error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to identify face");
    }
  }

  async deleteUserFace(personId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.endpoint}/face/v1.0/persongroups/${this.personGroupId}/persons/${personId}`,
        { headers: this.getHeaders() }
      );

      // Retrain person group after deletion
      await this.trainPersonGroup();
    } catch (error: any) {
      console.error(
        "Face deletion error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to delete face");
    }
  }

  private async trainPersonGroup(): Promise<void> {
    try {
      await axios.post(
        `${this.endpoint}/face/v1.0/persongroups/${this.personGroupId}/train`,
        {},
        { headers: this.getHeaders() }
      );

      // Wait for training to complete
      await this.waitForTrainingCompletion();
    } catch (error: any) {
      console.error("Training error:", error.response?.data || error.message);
      throw new Error("Failed to train person group");
    }
  }

  private async waitForTrainingCompletion(): Promise<void> {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const statusResponse = await axios.get(
          `${this.endpoint}/face/v1.0/persongroups/${this.personGroupId}/training`,
          { headers: this.getHeaders() }
        );

        const status = statusResponse.data.status;

        if (status === "succeeded") {
          console.log("Training completed successfully");
          return;
        } else if (status === "failed") {
          throw new Error("Training failed");
        }

        // Wait 2 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts++;
      } catch (error) {
        console.error("Error checking training status:", error);
        throw error;
      }
    }

    throw new Error("Training timeout");
  }

  private base64ToBuffer(base64: string): Buffer {
    // Remove data URL prefix if present
    const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, "");
    return Buffer.from(base64Data, "base64");
  }

  // Utility method to validate image format
  isValidImageFormat(base64: string): boolean {
    const imageRegex = /^data:image\/(jpeg|jpg|png|gif|bmp);base64,/;
    return imageRegex.test(base64);
  }

  // Utility method to compress image if needed
  async compressImage(base64: string, quality: number = 0.8): Promise<string> {
    // This is a placeholder for image compression logic
    // You might want to implement actual compression using a library like sharp
    return base64;
  }
}
