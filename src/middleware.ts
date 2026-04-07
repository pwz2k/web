import NextAuth from 'next-auth';

import authConfig from '@/auth.config';
import { getToken } from 'next-auth/jwt';

const { auth } = NextAuth(authConfig);

import {
  adminPrefix,
  apiPrefix,
  authRoutes,
  bannedRoutes,
  DEFAULT_BANNED_USER_REDIRECT,
  DEFAULT_LOGIN_REDIRECT,
  DEFAULT_SUSPENDED_USER_REDIRECT,
  moderatorPrefix,
  publicRoutes,
} from '@/routes';
import { UserRole } from '@prisma/client';

// Helper function to normalize path (remove trailing slash)
const normalizePath = (path: string) => {
  if (path !== '/' && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
};

export default auth(async (req) => {
  const { nextUrl } = req;

  // Normalize the pathname
  const pathname = normalizePath(nextUrl.pathname);

  // Use req.auth directly instead of currentUser() which doesn't work in Edge Runtime
  const authData = req.auth;
  const user = authData?.user;
  // In some deployments, NextAuth middleware's `req.auth.user` can be missing custom fields (e.g. role).
  // Fall back to decoding the JWT so role-based routing works reliably.
  const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req, secret: authSecret });
  const userRole = (user?.role ?? token?.role) as UserRole | undefined;
  const banned = (user?.banned ?? token?.banned) as boolean | undefined;
  const suspended = (user?.suspended ?? token?.suspended) as Date | string | null | undefined;

  const isLoggedIn = !!authData;

  const isApiRoute = pathname.startsWith(apiPrefix);
  const isPublicRoute = publicRoutes.includes(pathname);
  // Use startsWith for admin and moderator routes to handle all sub-routes
  const isAdminRoute = pathname.startsWith(adminPrefix);
  const isModeratorRoute = pathname.startsWith(moderatorPrefix);
  const isAuthRoute = authRoutes.includes(pathname);
  const isBannedRoute = bannedRoutes.includes(pathname);

  if (authData) {
    if (isBannedRoute) {
      // Redirect if the user is not banned or the suspension has expired
      if (!banned && (!suspended || new Date(suspended) < new Date())) {
        return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
      }
    } else {
      // Redirect if the user is banned
      if (banned) {
        return Response.redirect(
          new URL(DEFAULT_BANNED_USER_REDIRECT, nextUrl)
        );
      }

      // Redirect if the user is suspended and the suspension is still active
      if (suspended && new Date(suspended) >= new Date()) {
        return Response.redirect(
          new URL(DEFAULT_SUSPENDED_USER_REDIRECT, nextUrl)
        );
      }
    }
  }

  if (isApiRoute) {
    return;
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return;
  }

  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;

    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);

    return Response.redirect(
      new URL(`/auth/sign-in?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  if (isAdminRoute && userRole !== UserRole.ADMIN) {
    return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }

  // Moderator routes can be accessed by both MODERATOR and ADMIN roles
  if (
    isModeratorRoute &&
    userRole !== UserRole.MODERATOR &&
    userRole !== UserRole.ADMIN
  ) {
    return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }

  return;
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
