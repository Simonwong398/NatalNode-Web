import type { UserAccount } from '@natalnode/contracts';

export interface UserRepository {
  create(user: UserAccount): Promise<void>;
  findById(userId: string): Promise<UserAccount | null>;
}
