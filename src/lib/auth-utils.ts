/**
 * NextAuth v4 Utility Functions
 * This file provides helper functions for authentication
 * Used by middleware and server components
 */

import { getServerSession } from "next-auth/next"
import authConfig from "./auth"
import { Session } from "next-auth"
import { redirect } from 'next/navigation'

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

/**
 * Redirects users to their appropriate landing page based on role
 * Viewers go to /posts, all other roles go to /dashboard
 */
export function redirectToLandingPage(userRole: string): never {
  if (userRole === 'viewer') {
    redirect('/posts')
  } else {
    redirect('/dashboard')
  }
}

/**
 * Redirects unauthorized users to their appropriate page
 * This prevents viewers from being sent to dashboard first
 */
export function redirectUnauthorized(userRole: string): never {
  if (userRole === 'viewer') {
    redirect('/posts')
  } else {
    redirect('/dashboard')
  }
} 