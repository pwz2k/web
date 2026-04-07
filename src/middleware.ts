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

  // `req.auth` can be missing in some hosting/edge setups even when the session cookie exists.
  // Using `getToken` makes "logged in" detection consistent for protected routes like /profile, /billing.
  const isLoggedIn = !!authData || !!token;

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
  // NOTE:
  // Auth gating for protected pages is enforced in route-group layouts (e.g. (main), (admin), (moderator)).
  // This avoids edge-runtime session detection inconsistencies that can cause redirect loops.
  void isPublicRoute;

  // NOTE:
  // Role-based gating for `/admin` and `/moderator` is enforced in their respective route-group layouts.
  // This avoids edge-runtime auth field inconsistencies that can incorrectly redirect legit admins.
  // Keep middleware focused on: auth required vs public, and banned/suspended redirects.
  void isAdminRoute;
  void isModeratorRoute;
  void userRole;

  return;
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
