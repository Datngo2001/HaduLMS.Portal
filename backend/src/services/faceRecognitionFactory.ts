import { PythonFaceRecognitionService } from "./pythonFaceRecognitionService";

// Interface to ensure compatibility between services
export interface FaceRecognitionServiceInterface {
  registerUserFace(userId: string, imageBase64: string): Promise<string>;
  identifyFace(
    imageBase64: string
  ): Promise<{ userId: string; confidence: number } | null>;
  deleteUserFace(userIdOrPersonId: string): Promise<void>;
  initializePersonGroup?(): Promise<void>;
  isValidImageFormat(base64: string): boolean;
  compressImage?(base64: string, quality?: number): Promise<string>;
}

export class FaceRecognitionFactory {
  static getService(): FaceRecognitionServiceInterface {
    return new PythonFaceRecognitionService();
  }
}
