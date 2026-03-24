import { UserRepository } from "../../../../infrastructure/repositories/UserRepository";
import { IQueryHandler } from "../../../core/IQueryHandler";

export interface GetMeQueryRequest {
  userId: string;
}

export class GetMeQueryHandler implements IQueryHandler<GetMeQueryRequest, any> {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(query: GetMeQueryRequest): Promise<any> {
    const { userId } = query;
    const user = await this.userRepository.getProfileById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }
}
