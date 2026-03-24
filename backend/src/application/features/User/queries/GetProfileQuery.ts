import { UserRepository } from "../../../../infrastructure/repositories/UserRepository";
import { IQueryHandler } from "../../../core/IQueryHandler";

export interface GetProfileQueryRequest {
  userId: string;
}

export class GetProfileQueryHandler implements IQueryHandler<GetProfileQueryRequest, any> {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(query: GetProfileQueryRequest) {
    const { userId } = query;
    return await this.userRepository.getProfileById(userId);
  }
}
