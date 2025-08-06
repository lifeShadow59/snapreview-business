/**
 * User Registration API Route
 *
 * POST /api/auth/register
 *
 * This API endpoint handles user registration for the authentication system.
 * It integrates with the login page at /auth/login and registration page at /auth/register.
 *
 * Features:
 * - Validates email and password input
 * - Checks for existing users
 * - Creates new user account with hashed password
 * - Returns user data without password
 *
 * Used by: /auth/register page
 * Redirects to: /auth/login on success
 */

import { NextRequest, NextResponse } from "next/server";

import { createUser, getUserByEmail } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = await createUser(email, password, name);

    // Return success response (without password)
    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        createdAt: newUser.created_at,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
