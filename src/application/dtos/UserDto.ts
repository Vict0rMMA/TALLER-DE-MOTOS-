import { User } from '../../domain/entities/User';

export type PublicUser = Omit<User, 'passwordHash'>;

export const toPublicUser = (user: User): PublicUser => {
  const { passwordHash: _pw, ...publicUser } = user;
  return publicUser;
};
