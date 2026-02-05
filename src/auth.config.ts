import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { getUserByEmail } from './data/user';
import { LoginSchema } from './schemas';

import bcrypt from 'bcryptjs';

export default {
  secret: process.env.AUTH_SECRET,
  trustHost: true, // Required behind Nginx (pyp6.com, www, IP). Or set AUTH_TRUST_HOST=true in .env
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials) {
          console.error('No credentials provided');
          return null;
        }

        const validatedFields = LoginSchema.safeParse(credentials);
        if (!validatedFields.success) {
          console.error('Validation failed:', validatedFields.error);
          return null;
        }

        const { email, password } = validatedFields.data;

        const user = await getUserByEmail(email);
        if (!user || !user.password) {
          console.error('User not found or password missing');
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
          return { id: user.id, email: user.email, name: user.name }; // Return only necessary fields
        }

        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
