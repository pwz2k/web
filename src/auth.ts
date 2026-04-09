import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';

import authConfig from '@/auth.config';
import { db } from '@/lib/db';
import { Gender, SexualOrientation, UserRole } from '@prisma/client';
import {
  getDeviceIpAddress,
  getUserSessionFields,
} from './data/user';

import type { JWT } from 'next-auth/jwt';

/** How often JWT callback reloads user from DB (session is read on layout + each API). */
const JWT_DB_REFRESH_SEC = 90;

/**
 * Nginx (and browsers) reject requests when Cookie headers exceed ~8KB. NextAuth stores the JWT
 * in a cookie; long profile image URLs (UploadThing/OAuth) push it over the limit — especially
 * after many navigations in Firefox. Drop/truncate bulky string claims.
 */
function compactJwtForCookie(token: JWT): JWT {
  const maxImage = 256;
  const maxLoc = 128;

  if (typeof token.image === 'string' && token.image.length > maxImage) {
    token.image = null;
  }
  const pic = (token as { picture?: unknown }).picture;
  if (typeof pic === 'string' && pic.length > maxImage) {
    delete (token as { picture?: string }).picture;
  }
  if (typeof token.location === 'string' && token.location.length > maxLoc) {
    token.location = token.location.slice(0, maxLoc);
  }
  if (typeof token.email === 'string' && token.email.length > 254) {
    token.email = token.email.slice(0, 254);
  }
  if (typeof token.name === 'string' && token.name.length > 120) {
    token.name = token.name.slice(0, 120);
  }
  if (typeof token.username === 'string' && token.username.length > 80) {
    token.username = token.username.slice(0, 80);
  }
  return token;
}

function applySessionUpdateToToken(
  token: JWT,
  session: unknown
): void {
  if (!session || typeof session !== 'object') return;
  const s = session as Record<string, unknown>;
  const fromUser =
    s.user && typeof s.user === 'object'
      ? (s.user as Record<string, unknown>)
      : s;
  if (typeof fromUser.name === 'string') token.name = fromUser.name;
  if (typeof fromUser.email === 'string') token.email = fromUser.email;
  if (typeof fromUser.username === 'string') token.username = fromUser.username;
  if ('image' in fromUser) {
    token.image = (fromUser.image as string | null) ?? null;
  }
}

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
        return compactJwtForCookie(token);
      }

      // Never spread `session` into the token — arbitrary keys can balloon the JWT cookie.
      if (trigger === 'update' && session) {
        applySessionUpdateToToken(token, session);
      }

      if (!token.sub) return compactJwtForCookie(token);

      token.ipAddress =
        (await getDeviceIpAddress()) ?? token.ipAddress ?? null;

      const lastRefresh =
        typeof token.dbRefreshedAt === 'number' ? token.dbRefreshedAt : null;
      const shouldRefreshDb =
        trigger === 'update' ||
        lastRefresh === null ||
        now - lastRefresh >= JWT_DB_REFRESH_SEC;

      if (!shouldRefreshDb) {
        return compactJwtForCookie(token);
      }

      const existingUser = await getUserSessionFields(token.sub);

      if (!existingUser) return compactJwtForCookie(token);

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

      return compactJwtForCookie(token);
    },
  },
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  debug: process.env.NODE_ENV === 'development',
  ...authConfig,
});
