/**
 * Application Providers Component
 * This component wraps the entire application with necessary context providers
 * Currently includes NextAuth SessionProvider for authentication state management
 */

"use client"

import type React from "react"
import { SessionProvider } from "next-auth/react"

/**
 * Props interface for the Providers component
 */
interface ProvidersProps {
  /** Child components to be wrapped with providers */
  children: React.ReactNode
}

/**
 * Providers Component
 * Wraps the application with all necessary context providers
 * 
 * @param children - The child components to be wrapped
 * @returns JSX element with providers
 */
export function Providers({ children }: ProvidersProps) {
  return (
    /**
     * SessionProvider from NextAuth
     * Provides authentication session context to all child components
     * Enables useSession hook throughout the application
     * 
     * Key features:
     * - Automatic session refresh when tab becomes active
     * - Session persistence across browser tabs
     * - Automatic token refresh before expiration
     */
    <SessionProvider
      // Automatically refetch session when window gains focus
      refetchOnWindowFocus={true}
      // Refetch session every 5 minutes to ensure it's up to date
      refetchInterval={5 * 60}
      // Only refetch when session is close to expiring
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  )
}
