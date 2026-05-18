import { UserRepository } from '../../../domain/repositories/UserRepository';
import { WorkshopRepository } from '../../../domain/repositories/WorkshopRepository';
import { PasswordHasher } from '../../../domain/services/PasswordHasher';
import { DomainError } from '../../../domain/errors/DomainError';
import { UserRole } from '../../../domain/entities/User';
import { PublicUser, toPublicUser } from '../../dtos/UserDto';

type Input = {
  name: string;
  email: string;
  password: string;
  workshopId: string;
  role?: UserRole;
};

export class RegisterUser {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly workshopRepo: WorkshopRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: Input): Promise<PublicUser> {
    const workshop = await this.workshopRepo.findById(input.workshopId);
    if (!workshop) throw new DomainError('Taller no encontrado', 404);

    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) throw new DomainError('El email ya está registrado', 409);

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = await this.userRepo.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role ?? 'mechanic',
      workshopId: input.workshopId,
      active: true,
    });

    return toPublicUser(user);
  }
}
