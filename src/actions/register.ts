'use server';

import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import * as z from 'zod';

import { getUserByEmail } from '@/data/user';
import { RegisterSchema } from '@/schemas';

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  try {
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

    const hashedPassword = await bcrypt.hash(password, 10);

    let existingUser;
    try {
      existingUser = await getUserByEmail(email);
    } catch (dbError: unknown) {
      // Check if it's a database connection error
      const err = dbError as { message?: string; code?: string };
      if (err?.message?.includes("Can't reach database server") || 
          err?.code === 'P1001') {
        return { 
          error: 'Database connection failed. Please check your database configuration or contact support.' 
        };
      }
      throw dbError; // Re-throw if it's a different error
    }

    if (existingUser) {
      return { error: 'Email already in use!' };
    }

    let user;
    try {
      user = await db.user.create({
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
    } catch (dbError: unknown) {
      // Check if it's a database connection error
      const err = dbError as { message?: string; code?: string };
      if (err?.message?.includes("Can't reach database server") || 
          err?.code === 'P1001') {
        return { 
          error: 'Database connection failed. Please check your database configuration or contact support.' 
        };
      }
      // Check for unique constraint violations
      if (err?.code === 'P2002') {
        return { error: 'Username or email already in use!' };
      }
      throw dbError; // Re-throw if it's a different error
    }

    if (image) {
      try {
        await db.post.create({
          data: {
            image,
            caption: 'First Upload!',
            tags: 'first upload',
            creatorId: user.id,
          },
        });
      } catch (dbError: unknown) {
        // If post creation fails but user is created, log error but don't fail registration
        console.error('Failed to create initial post:', dbError);
      }
    }

    return { success: 'Account created successfully!' };
  } catch (error: unknown) {
    console.error('Registration error:', error);
    // Generic error fallback
    const err = error as { message?: string; code?: string };
    if (err?.message?.includes("Can't reach database server") || 
        err?.code === 'P1001') {
      return { 
        error: 'Database connection failed. Please check your database configuration or contact support.' 
      };
    }
    return { error: 'Something went wrong. Please try again later.' };
  }
};
