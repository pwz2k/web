'use server';

import { db } from '@/lib/db';
import bcrpyt from 'bcryptjs';
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

    const hashedPassword = await bcrpyt.hash(password, 10);

    let existingUser;
    try {
      existingUser = await getUserByEmail(email);
    } catch (dbError: any) {
      // Check if it's a database connection error
      if (dbError?.message?.includes("Can't reach database server") || 
          dbError?.code === 'P1001') {
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
    } catch (dbError: any) {
      // Check if it's a database connection error
      if (dbError?.message?.includes("Can't reach database server") || 
          dbError?.code === 'P1001') {
        return { 
          error: 'Database connection failed. Please check your database configuration or contact support.' 
        };
      }
      // Check for unique constraint violations
      if (dbError?.code === 'P2002') {
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
      } catch (dbError: any) {
        // If post creation fails but user is created, log error but don't fail registration
        console.error('Failed to create initial post:', dbError);
      }
    }

    return { success: 'Account created successfully!' };
  } catch (error: any) {
    console.error('Registration error:', error);
    // Generic error fallback
    if (error?.message?.includes("Can't reach database server") || 
        error?.code === 'P1001') {
      return { 
        error: 'Database connection failed. Please check your database configuration or contact support.' 
      };
    }
    return { error: 'Something went wrong. Please try again later.' };
  }
};
