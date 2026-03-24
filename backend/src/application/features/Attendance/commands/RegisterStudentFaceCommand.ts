import { UserRepository } from "../../../../infrastructure/repositories/UserRepository";
import { FaceRecognitionFactory } from "../../../../services/faceRecognitionFactory";
import { ICommandHandler } from "../../../core/ICommandHandler";

export interface RegisterStudentFaceCommandRequest {
  studentId: string;
  image: string;
  teacherId: string;
}

export class RegisterStudentFaceCommandHandler implements ICommandHandler<RegisterStudentFaceCommandRequest, any> {
  private userRepository: UserRepository;
  private faceService = FaceRecognitionFactory.getService();

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(command: RegisterStudentFaceCommandRequest) {
    const { studentId, image, teacherId } = command;

    if (!this.faceService.isValidImageFormat(image)) {
      throw new Error("Invalid image format. Please provide a valid base64 image.");
    }

    const student = await this.userRepository.findUnique({
      where: { id: studentId },
    });

    if (!student || student.role !== "STUDENT" || !student.isActive) {
      throw new Error("Student not found or is not active");
    }

    const hadExistingFace = student.hasFaceRegistered;
    if (hadExistingFace) {
      try {
        await this.faceService.deleteUserFace(studentId);
      } catch (error) {
        console.warn("Failed to delete existing face, continuing with registration:", error);
      }
    }

    const personId = await this.faceService.registerUserFace(studentId, image);

    await this.userRepository.update({
      where: { id: studentId },
      data: { hasFaceRegistered: true, faceRegisteredAt: new Date() } as any,
    });

    return { personId, hadExistingFace, student };
  }
}
