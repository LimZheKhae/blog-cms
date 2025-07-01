/**
 * NextAuth Type Declarations
 * This file extends NextAuth's built-in types to include our custom user properties
 * It ensures TypeScript recognizes our custom fields like 'role' and 'id'
 */

import type { DefaultSession } from "next-auth"

/**
 * Extend the NextAuth Session interface
 * Adds custom user properties to the default session type
 */
declare module "next-auth" {
  interface Session {
    user: {
      /** Unique user identifier from database */
      id: string
      /** User role for authorization (admin, editor, author, viewer) */
      role: "admin" | "editor" | "author" | "viewer"
    } & DefaultSession["user"]
  }

  /**
   * Extend the NextAuth User interface
   * Adds custom properties to the user object returned by providers
   */
  interface User {
    /** Unique user identifier from database */
    id: string
    /** User role for authorization (admin, editor, author, viewer) */
    role: "admin" | "editor" | "author" | "viewer"
  }
}

/**
 * Extend the NextAuth JWT interface
 * Adds custom properties to the JWT token for session persistence
 */
declare module "next-auth/jwt" {
  interface JWT {
    /** User role stored in JWT for quick access */
    role: "admin" | "editor" | "author" | "viewer"
    /** User ID stored in JWT for identification */
    id: string
  }
}
