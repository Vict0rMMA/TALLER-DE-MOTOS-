import { UserRepository } from '../../../domain/repositories/UserRepository';
import { WorkshopRepository } from '../../../domain/repositories/WorkshopRepository';
import { PasswordHasher } from '../../../domain/services/PasswordHasher';
import { DomainError } from '../../../domain/errors/DomainError';
import { signToken } from '../../../infrastructure/config/jwt';
import { toPublicUser } from '../../dtos/UserDto';

type Input = {
  name: string;
  email: string;
  password: string;
  workshopName: string;
  workshopNit?: string;
  workshopPhone?: string;
  workshopAddress?: string;
};

type Output = { token: string; user: ReturnType<typeof toPublicUser> };

export class RegisterWorkshop {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly workshopRepo: WorkshopRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: Input): Promise<Output> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) throw new DomainError('El email ya está registrado', 409);

    const nit = input.workshopNit?.trim() || undefined;
    if (nit) {
      const nitTaken = await this.workshopRepo.findByNit(nit);
      if (nitTaken) throw new DomainError('Ese NIT ya está registrado', 409);
    }

    const workshop = await this.workshopRepo.create({
      name: input.workshopName.trim(),
      nit,
      phone: input.workshopPhone?.trim() || undefined,
      address: input.workshopAddress?.trim() || undefined,
      plan: 'free',
    });

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = await this.userRepo.create({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash,
      role: 'owner',
      workshopId: workshop.id,
      active: true,
    });

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
