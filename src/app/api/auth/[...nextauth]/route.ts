/**
 * NextAuth.js API Route Handlers
 *
 * Route: /api/auth/[...nextauth]
 *
 * This file exports the NextAuth.js route handlers for all authentication endpoints.
 * It handles sign-in, sign-out, session management, and OAuth callbacks.
 *
 * Endpoints:
 * - GET/POST /api/auth/signin - Sign-in page and authentication
 * - GET/POST /api/auth/signout - Sign-out functionality
 * - GET /api/auth/session - Get current session
 * - GET /api/auth/csrf - CSRF token
 * - GET /api/auth/providers - Available providers
 *
 * Configuration: src/lib/auth.ts
 * Custom pages: /auth/login (configured in auth.ts)
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
