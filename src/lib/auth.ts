/**
 * NextAuth v4 Configuration
 * This file configures authentication for the blog CMS using NextAuth.js v4
 * It handles user authentication via credentials (email-based for demo)
 */

import NextAuth, { type DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import MicrosoftProvider from "next-auth/providers/azure-ad"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"

// Initialize Neon database connection
const sql = neon(process.env.DATABASE_URL!)

/**
 * Schema for validating login credentials
 * Uses Zod for runtime validation of email format
 */
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

/**
 * Database function to find user by email
 * Returns user data if found, null if not found
 */
async function getUserByEmail(email: string) {
  try {
    // Query database for user with matching email
    const result = await sql`
      SELECT id, email, name, role, avatar_url, created_at
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `
    
    // Return first user if found, otherwise null
    return result.length > 0 ? result[0] : null
  } catch (error) {
    console.error("Database error when fetching user:", error)
    return null
  }
}

/**
 * NextAuth v4 configuration object
 * Defines providers, callbacks, pages, and session strategy
 */
export default NextAuth({
  /**
   * Authentication providers configuration
   * Uses both Credentials and Microsoft OAuth providers
   */
  providers: [
    // Microsoft/Outlook OAuth Provider
    MicrosoftProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    }),
    
    // Credentials provider for email-based auth
    CredentialsProvider({
      // Provider display name
      name: "credentials",
      
      // Define the credential fields for the login form
      credentials: {
        email: { 
          label: "Email", 
          type: "email",
          placeholder: "Enter your email address"
        },
        password: { 
          label: "Password", 
          type: "password",
          placeholder: "Enter your password"
        },
      },
      
      /**
       * Authorization function - validates user credentials
       * @param credentials - The submitted login credentials
       * @returns User object if valid, null if invalid
       */
      async authorize(credentials) {
        try {
          // Validate credentials format using Zod schema
          const validatedFields = loginSchema.safeParse(credentials)
          
          if (!validatedFields.success) {
            console.log("Invalid credential format:", validatedFields.error.flatten().fieldErrors)
            return null
          }

          const { email } = validatedFields.data
          
          // Fetch user from database
          const user = await getUserByEmail(email)
          
          if (!user) {
            console.log("User not found for email:", email)
            return null
          }

          // For demo purposes, we skip password verification
          // In production, you would verify the password hash here:
          // const isValidPassword = await bcrypt.compare(password, user.password_hash)
          // if (!isValidPassword) return null

          // Return user object with required fields
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role as "admin" | "editor" | "author" | "viewer",
            image: user.avatar_url || null,
          }
        } catch (error) {
          console.error("Authorization error:", error)
          return null
        }
      },
    }),
  ],

  /**
   * Callback functions to control authentication flow
   */
  callbacks: {
    /**
     * SignIn callback - controls whether a user is allowed to sign in
     * For OAuth providers, check if email exists in database
     */
    async signIn({ user, account, profile }) {
      // Allow credentials provider (already checked in authorize function)
      if (account?.provider === "credentials") {
        return true
      }
      
      // For OAuth providers (Microsoft), check if email exists in database
      if (account?.provider === "azure-ad" && user.email) {
        const dbUser = await getUserByEmail(user.email)
        if (dbUser) {
          // User exists in database, allow sign in
          // Update user object with database info
          user.id = dbUser.id.toString()
          user.role = dbUser.role
          return true
        } else {
          // User email not found in database, deny sign in
          console.log("Microsoft user email not found in database:", user.email)
          return false
        }
      }
      
      return true
    },
    /**
     * JWT callback - called whenever a JWT is accessed
     * Used to persist user data in the JWT token
     * @param token - The JWT token
     * @param user - User object (only available on signin)
     * @returns Modified token
     */
    async jwt({ token, user }) {
      // If user is available (on signin), add custom fields to token
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },

    /**
     * Session callback - called when session is accessed
     * Shapes the session object that's returned to the client
     * @param session - The session object
     * @param token - The JWT token
     * @returns Modified session
     */
    async session({ session, token }) {
      // Add custom fields from token to session
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as "admin" | "editor" | "author" | "viewer"
      }
      return session
    },
  },

  /**
   * Custom pages configuration
   * Overrides default NextAuth pages with custom implementations
   */
  pages: {
    signIn: "/auth/signin", // Custom signin page
  },

  /**
   * Session configuration
   * Uses JWT strategy for stateless authentication
   */
  session: {
    strategy: "jwt",
    // Session expires after 7 days of inactivity
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },

  /**
   * Security and debugging configuration
   */
  debug: process.env.NODE_ENV === "development", // Enable debug logs in development
  
  /**
   * Secret for JWT signing and encryption
   * Should be a random string in production
   */
  secret: process.env.NEXTAUTH_SECRET,
})
