/**
 * NextAuth v4 Configuration
 * This file configures authentication for the blog CMS using NextAuth.js v4
 * It handles user authentication via credentials (email-based with password) and OAuth
 */

import NextAuth, { type DefaultSession, type AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import MicrosoftProvider from "next-auth/providers/azure-ad"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"
import bcrypt from "bcryptjs"

// Initialize Neon database connection
const sql = neon(process.env.DATABASE_URL!)

/**
 * Schema for validating login credentials
 * Uses Zod for runtime validation of email format and password requirements
 */
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

/**
 * Database function to find user by email
 * Returns user data including password hash if found, null if not found
 */
async function getUserByEmail(email: string) {
  try {
    // Query database for user with matching email
    const result = await sql`
      SELECT id, email, name, role, avatar_url, password_hash, created_at
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
 * Database function to create a new user
 * Used for OAuth providers to automatically create user accounts (without password)
 */
async function createUser(email: string, name: string, avatarUrl?: string) {
  try {
    const result = await sql`
      INSERT INTO users (email, name, role, avatar_url, password_hash)
      VALUES (${email}, ${name}, 'viewer', ${avatarUrl || null}, NULL)
      RETURNING id, email, name, role, avatar_url, created_at
    `
    
    return result.length > 0 ? result[0] : null
  } catch (error) {
    console.error("Database error when creating user:", error)
    return null
  }
}

/**
 * Database function to update user's last login timestamp
 * Called whenever a user successfully signs in
 */
async function updateLastLogin(userId: string) {
  try {
    await sql`
      UPDATE users 
      SET last_login_at = CURRENT_TIMESTAMP 
      WHERE id = ${parseInt(userId)}
    `
  } catch (error) {
    console.error("Database error when updating last login:", error)
  }
}

/**
 * NextAuth v4 configuration object
 * Defines providers, callbacks, pages, and session strategy
 */
export const authOptions: AuthOptions = {
  /**
   * Authentication providers configuration
   * Uses Credentials, Google OAuth, and Microsoft OAuth providers
   */
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // Microsoft/Outlook OAuth Provider
    MicrosoftProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    }),
    
    // Credentials provider for email-based auth with password verification
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
       * Authorization function - validates user credentials with password verification
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

          const { email, password } = validatedFields.data
          
          // Fetch user from database
          const user = await getUserByEmail(email)
          
          if (!user) {
            console.log("User not found for email:", email)
            return null
          }

          // Check if user has a password hash (credential-based user)
          if (!user.password_hash) {
            console.log("User exists but has no password (OAuth user):", email)
            return null
          }

          // Verify password using bcrypt
          const isValidPassword = await bcrypt.compare(password, user.password_hash)
          
          if (!isValidPassword) {
            console.log("Invalid password for user:", email)
            return null
          }

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
     * For OAuth providers, automatically create user if not exists
     */
    async signIn({ user, account, profile }: any) {
      // Allow credentials provider (already checked in authorize function)
      if (account?.provider === "credentials") {
        // Update last login for credentials provider
        if (user?.id) {
          await updateLastLogin(user.id)
        }
        return true
      }
      
      // Handle Google OAuth
      if (account?.provider === "google" && user.email && user.name) {
        // console.log("SignIn callback - Google OAuth user:", user.email)
        // console.log("SignIn callback - User object:", user)
        let dbUser = await getUserByEmail(user.email)
        // console.log("SignIn callback - Database user found:", dbUser)
        
        if (!dbUser) {
          // User doesn't exist, create new user with viewer role
          // console.log("Creating new Google user:", user.email)
          dbUser = await createUser(user.email, user.name, user.image || undefined)
          
          if (!dbUser) {
            console.error("Failed to create new Google user:", user.email)
            return false
          }
          // console.log("SignIn callback - Created new user:", dbUser)
        }
        
        // Update user object with database info
        user.id = dbUser.id.toString()
        user.role = dbUser.role
        // console.log("SignIn callback - Updated user object:", { id: user.id, role: user.role, email: user.email })
        
        // Update last login timestamp
        await updateLastLogin(user.id)
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
          
          // Update last login timestamp
          await updateLastLogin(user.id)
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
    async jwt({ token, user }: any) {
      // console.log('=== JWT CALLBACK DEBUG ===')
      // console.log('JWT callback - user:', user)
      // console.log('JWT callback - token before:', token)
      
      // If user is available (on signin), add custom fields to token
      if (user) {
        token.id = user.id
        // console.log('JWT - Setting token.id from user.id:', token.id)
        token.role = user.role
        // console.log('JWT - Setting token.role from user.role:', token.role)
        
        // If role is missing from user object, fetch from database
        if (!token.role && token.email) {
          console.log('Role missing from user, fetching from database for:', token.email)
          const dbUser = await getUserByEmail(token.email as string)
          if (dbUser) {
            token.role = dbUser.role
            token.id = dbUser.id.toString()
            // console.log('JWT - Set from DB - token.id:', token.id, 'token.role:', token.role)
          }
        }
      }
      
      // If this is a subsequent JWT call and role is missing, fetch it
      if (!token.role && token.email) {
        console.log('Role missing from token, fetching from database for:', token.email)
        const dbUser = await getUserByEmail(token.email as string)
        if (dbUser) {
          token.role = dbUser.role
          token.id = dbUser.id.toString()
          // console.log('JWT - Subsequent call - Set from DB - token.id:', token.id, 'token.role:', token.role)
        }
      }
      
      // If ID is still missing, fetch from database
      if (!token.id && token.email) {
        // console.log('ID missing from token, fetching from database for:', token.email)
        const dbUser = await getUserByEmail(token.email as string)
        if (dbUser) {
          token.id = dbUser.id.toString()
          token.role = dbUser.role
          // console.log('JWT - ID missing - Set from DB - token.id:', token.id, 'token.role:', token.role)
        }
      }
      
      // console.log('JWT callback - token after:', token)
      // console.log('=== END JWT CALLBACK DEBUG ===')
      return token
    },

    /**
     * Session callback - called when session is accessed
     * Shapes the session object that's returned to the client
     * @param session - The session object
     * @param token - The JWT token
     * @returns Modified session
     */
    async session({ session, token }: any) {
      // console.log('=== SESSION CALLBACK DEBUG ===')
      // console.log('Session callback - token:', token)
      // console.log('Session callback - session before:', session)
      
      // Add custom fields from token to session
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as "admin" | "editor" | "author" | "viewer"
        // console.log('Session - Set session.user.id:', session.user.id)
        // console.log('Session - Set session.user.role:', session.user.role)
      }
      
      // console.log('Session callback - session after:', session)
      // console.log('=== END SESSION CALLBACK DEBUG ===')
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
    strategy: "jwt" as const,
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
}

export default NextAuth(authOptions)
