'use server';

import { db } from '@/lib/db';
import bcrpyt from 'bcryptjs';
import * as z from 'zod';

import { getUserByEmail } from '@/data/user';
import { RegisterSchema } from '@/schemas';

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: 'Invalid fields!' };
  }

  const {
    username,
    email,
    password,
    confirmPassword,
    dateOfBirth,
    gender,
    sexualOrientation,
    image,
  } = validatedFields.data;

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match!' };
  }

  const hashedPassword = await bcrpyt.hash(password, 10);

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { error: 'Email already in use!' };
  }

  const user = await db.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      dateOfBirth,
      gender,
      sexualOrientation,
      image,
    },
  });

  if (image) {
    await db.post.create({
      data: {
        image,
        caption: 'First Upload!',
        tags: 'first upload',
        creatorId: user.id,
      },
    });
  }

  return { success: 'Account created successfully!' };
};
