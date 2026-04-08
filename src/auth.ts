import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';

import authConfig from '@/auth.config';
import { db } from '@/lib/db';
import { Gender, SexualOrientation, UserRole } from '@prisma/client';
import {
  getDeviceIpAddress,
  getUserSessionFields,
} from './data/user';

/** How often JWT callback reloads user from DB (session is read on layout + each API). */
const JWT_DB_REFRESH_SEC = 90;

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: '/auth/sign-in',
    error: '/auth/sign-in',
  },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    async session(props) {
      const session = props.session;
      if ('token' in props) {
        const token = props.token;

        if (token.sub && session.user) {
          session.user.id = token.sub;
        }

        if (token.role && session.user) {
          session.user.role = token.role as UserRole;
        }

        if (session.user) {
          session.user.name = token.name;
          session.user.email = token.email as string;
          session.user.username = token.username as string;
          session.user.image = token.image as string;
          session.user.role = token.role as UserRole;

          session.user.banned = token.banned as boolean;
          session.user.suspended = token.suspended as Date | null | undefined;

          session.user.location = token.location as string;
          session.user.gender = token.gender as Gender;
          session.user.sexualOrientation =
            token.sexualOrientation as SexualOrientation;

          session.user.ipAddress = token.ipAddress as string;
        }
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      const now = Math.floor(Date.now() / 1000);

      // On initial sign-in, the 'user' parameter is populated from authorize()
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        // Include role from authorize client
        if ('role' in user) {
          token.role = user.role as UserRole;
        }
        if ('banned' in user) {
          token.banned = user.banned as boolean;
        }
        if ('suspended' in user) {
          token.suspended = user.suspended as Date | null;
        }
        if ('username' in user && user.username != null) {
          token.username = user.username as string;
        }
        if ('image' in user) {
          token.image = user.image as string | null;
        }
        token.dbRefreshedAt = now;
        token.ipAddress = (await getDeviceIpAddress()) ?? token.ipAddress ?? null;
        return token;
      }

      // Handle session update trigger
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      if (!token.sub) return token;

      token.ipAddress =
        (await getDeviceIpAddress()) ?? token.ipAddress ?? null;

      const lastRefresh =
        typeof token.dbRefreshedAt === 'number' ? token.dbRefreshedAt : null;
      const shouldRefreshDb =
        trigger === 'update' ||
        lastRefresh === null ||
        now - lastRefresh >= JWT_DB_REFRESH_SEC;

      if (!shouldRefreshDb) {
        return token;
      }

      const existingUser = await getUserSessionFields(token.sub);

      if (!existingUser) return token;

      token.name = existingUser.name || existingUser.username;
      token.username = existingUser.username;
      token.email = existingUser.email;
      token.image = existingUser.image;
      token.role = existingUser.role;

      token.banned = existingUser.banned;
      token.suspended = existingUser.suspended;

      token.gender = existingUser.gender;
      token.sexualOrientation = existingUser.sexualOrientation;
      token.location = existingUser.location;
      token.dbRefreshedAt = now;

      return token;
    },
  },
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  debug: process.env.NODE_ENV === 'development',
  ...authConfig,
});
