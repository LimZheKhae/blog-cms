/**
 * NextAuth v4 Utility Functions
 * This file provides helper functions for authentication
 * Used by middleware and server components
 */

import { getServerSession } from "next-auth/next"
import authConfig from "./auth"
import { Session } from "next-auth"

/**
 * Get the current session on the server side
 * Used in middleware and server components
 * @returns Session object or null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  return await getServerSession(authConfig)
}

/**
 * Check if user is authenticated
 * @returns boolean indicating authentication status
 */
export async function isAuthenticated() {
  const session = await getSession()
  return !!(session as Session)?.user
}

/**
 * Get current user from session
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession()
  return (session as Session)?.user || null
} 