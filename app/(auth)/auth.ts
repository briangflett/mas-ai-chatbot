import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import AzureAD from 'next-auth/providers/azure-ad';
import { createGuestUser, getUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';

export type UserType = 'guest' | 'regular';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    AzureAD({
      id: 'azure-ad',
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID || 'common'}/v2.0`,
      authorization: {
        params: {
          scope: 'openid profile email',
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          type: 'regular',
        };
      },
    }),
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) return null;

        return { ...user, type: 'regular' };
      },
    }),
    Credentials({
      id: 'guest',
      credentials: {},
      async authorize() {
        const [guestUser] = await createGuestUser();
        return { ...guestUser, type: 'guest' };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For Azure AD users, ensure they exist in our database
      if (account?.provider === 'azure-ad' && user.email) {
        try {
          const existingUsers = await getUser(user.email);
          if (existingUsers.length === 0) {
            // Create user in database
            const { createUser } = await import('@/lib/db/queries');
            const newUser = await createUser(user.email, ''); // No password for OAuth users
            if (newUser && newUser.length > 0) {
              console.log('✅ Created new Azure AD user in database:', { id: newUser[0].id, email: user.email });
              // Update the user object with the database ID
              user.id = newUser[0].id;
            } else {
              console.error('❌ Failed to create user - no user returned');
              return false;
            }
          } else {
            // Use existing user ID
            user.id = existingUsers[0].id;
            console.log('✅ Found existing Azure AD user in database:', { id: user.id, email: user.email });
          }
        } catch (error) {
          console.error('❌ Error creating/finding Azure AD user:', error);
          return false; // Prevent sign in if we can't create/find user
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
      }

      // Check if guest user has completed onboarding and promote to regular user
      if (token.type === 'guest' && token.id) {
        try {
          const { getUserById } = await import('@/lib/db/queries');
          const userData = await getUserById(token.id);
          if (userData?.role) {
            token.type = 'regular';
          }
        } catch (error) {
          console.error('Error checking user onboarding status:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
      }

      return session;
    },
  },
});
