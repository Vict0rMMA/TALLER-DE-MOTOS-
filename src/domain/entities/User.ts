export const USER_ROLES = ['owner', 'mechanic', 'seller'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type User = {
  id: string;
  workshopId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
};
