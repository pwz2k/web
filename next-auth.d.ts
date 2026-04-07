import { Gender, SexualOrientation, UserRole } from '@prisma/client';
import { type DefaultSession } from 'next-auth';

export type ExtendedUser = DefaultSession['user'] & {
  id?: string;
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

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: UserRole;
    username?: string;
    name?: string | null;
    email?: string;
    image?: string;
    banned?: boolean;
    suspended?: Date | null;
    gender?: Gender;
    sexualOrientation?: SexualOrientation;
    location?: string;
    ipAddress?: string;
  }
}
