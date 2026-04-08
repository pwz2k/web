import { db } from '@/lib/db';

import { headers } from 'next/headers';

export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.user.findUnique({
      where: {
        email,
      },
    });

    return user;
  } catch (err) {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: {
        id,
      },
    });
    return user;
  } catch (err) {
    return null;
  }
};

/** Slim fetch for JWT refresh — avoids loading full User row on every session read. */
export const getUserSessionFields = async (id: string) => {
  try {
    return await db.user.findUnique({
      where: { id },
      select: {
        name: true,
        email: true,
        username: true,
        image: true,
        role: true,
        banned: true,
        suspended: true,
        gender: true,
        sexualOrientation: true,
        location: true,
      },
    });
  } catch {
    return null;
  }
};

export const getDeviceIpAddress = async () => {
  const requestHeaders = headers();

  try {
    const ipAddress = requestHeaders.get('x-forwarded-for') || 'unknown';

    return ipAddress;
  } catch (err) {
    return null;
  }
};
