import { Gender, SexualOrientation, UserRole } from '@prisma/client';
import { type DefaultSession } from 'next-auth';

export type ExtendedUser = DefaultSession['user'] & {
  role: UserRole;
  username: string;
  gender: Gender;
  sexualOrientation: SexualOrientation;
  location: string;
  banned: boolean;
  suspended?: Date | null;
  ipAddress?: string;
};

declare module 'next-auth' {
  interface Session {
    user: ExtendedUser;
  }
}
