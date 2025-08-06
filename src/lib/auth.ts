/**
 * NextAuth.js Configuration
 *
 * This file configures NextAuth.js v5 for the application with:
 * - Credentials provider for email/password authentication
 * - Google OAuth provider for social authentication
 * - JWT session strategy (no database adapter for edge compatibility)
 * - Custom sign-in page: /auth/login
 * - Password hashing with bcryptjs
 * - PostgreSQL integration for user management
 *
 * Authentication Flow:
 * 1. User signs in at /auth/login with email/password OR Google OAuth
 * 2. Credentials are validated against PostgreSQL database OR Google OAuth
 * 3. JWT token is created and stored in session
 * 4. User is redirected to dashboard
 *
 * Google OAuth Integration:
 * - Uses name and email only (no profile picture)
 * - Creates user in database if doesn't exist
 * - Links existing users by email
 */

import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import pool from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          // Explicitly exclude image/picture from Google profile
          image: null,
        };
      },
    }),
    // Credentials Provider for email/password authentication
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Check if user exists
          const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [credentials.email]
          );

          const user = result.rows[0];

          if (!user) {
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // Return user object (without password)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === "google") {
        try {
          // Check if user already exists in database
          const existingUser = await getUserByEmail(user.email!);

          if (!existingUser) {
            // Create new user for Google OAuth (no password needed)
            await pool.query(
              "INSERT INTO users (email, name, image) VALUES ($1, $2, $3)",
              [user.email, user.name, null] // Explicitly set image to null
            );
          }

          return true;
        } catch (error) {
          console.error("Error handling Google sign-in:", error);
          return false;
        }
      }

      // Allow credentials sign-in
      return true;
    },
    async jwt({ token, user, account }) {
      // Handle first-time sign-in
      if (user) {
        if (account?.provider === "google") {
          // For Google OAuth, get the database user
          const dbUser = await getUserByEmail(user.email!);
          if (dbUser) {
            token.id = dbUser.id;
          }
        } else {
          // For credentials, use the user ID directly
          token.id = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        // Ensure no image is set in session
        session.user.image = null;
      }
      return session;
    },
  },
  pages: {
    // Custom authentication pages
    signIn: `${process.env.NEXTAUTH_URL}/auth/login`, // Sign-in page: http://localhost:3000/auth/login
    // Note: signUp is not a NextAuth.js built-in page, we handle registration via /auth/register
  },
});

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Helper function to create a user
export async function createUser(
  email: string,
  password: string,
  name?: string
) {
  const hashedPassword = await hashPassword(password);

  try {
    const result = await pool.query(
      "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, image, created_at",
      [email, hashedPassword, name || null]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

// Helper function to get user by email
export async function getUserByEmail(email: string) {
  try {
    const result = await pool.query(
      "SELECT id, email, name, image, created_at FROM users WHERE email = $1",
      [email]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw error;
  }
}
