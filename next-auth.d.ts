import { Gender, SexualOrientation, UserRole } from '@prisma/client';
import { type DefaultSession } from 'next-auth';

export type ExtendedUser = DefaultSession['user'] & {
  role: UserRole;
  username?: string | null;
  gender?: Gender | null;
  sexualOrientation?: SexualOrientation | null;
  location?: string | null;
  banned: boolean;
  suspended?: Date | null;
  ipAddress?: string;
};

declare module 'next-auth' {
  interface Session {
    user: ExtendedUser;
  }
}
