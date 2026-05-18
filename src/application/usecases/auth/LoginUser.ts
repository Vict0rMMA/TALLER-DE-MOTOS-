import { UserRepository } from '../../../domain/repositories/UserRepository';
import { PasswordHasher } from '../../../domain/services/PasswordHasher';
import { DomainError } from '../../../domain/errors/DomainError';
import { signToken } from '../../../infrastructure/config/jwt';
import { toPublicUser } from '../../dtos/UserDto';

type Input = { email: string; password: string };
type Output = { token: string; user: ReturnType<typeof toPublicUser> };

export class LoginUser {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: Input): Promise<Output> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user || !user.active) throw new DomainError('Credenciales inválidas', 401);

    const valid = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!valid) throw new DomainError('Credenciales inválidas', 401);

    const token = signToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      workshopId: user.workshopId,
    });

    return { token, user: toPublicUser(user) };
  }
}
