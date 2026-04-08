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
    /** UNIX seconds; last time token fields were refreshed from DB */
    dbRefreshedAt?: number;
    id?: string;
    role?: UserRole;
    username?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    banned?: boolean;
    suspended?: Date | null;
    gender?: Gender | null;
    sexualOrientation?: SexualOrientation | null;
    location?: string | null;
    ipAddress?: string | null;
  }
}
