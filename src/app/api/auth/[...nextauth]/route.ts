/**
 * NextAuth API Route Handler
 * Compatible with Next.js 13+ App Directory and NextAuth v4
 */

import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { neon } from "@neondatabase/serverless"
import { z } from "zod"

// Initialize Neon database connection
const sql = neon(process.env.DATABASE_URL!)

// Schema for validating login credentials
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

// Database function to find user by email
async function getUserByEmail(email: string) {
  try {
    const result = await sql`
      SELECT id, email, name, role, avatar_url, created_at
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `
    return result.length > 0 ? result[0] : null
  } catch (error) {
    console.error("Database error when fetching user:", error)
    return null
  }
}

// NextAuth configuration
const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
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
      async authorize(credentials) {
        try {
          const validatedFields = loginSchema.safeParse(credentials)
          
          if (!validatedFields.success) {
            console.log("Invalid credential format:", validatedFields.error.flatten().fieldErrors)
            return null
          }

          const { email } = validatedFields.data
          const user = await getUserByEmail(email)
          
          if (!user) {
            console.log("User not found for email:", email)
            return null
          }

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
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as "admin" | "editor" | "author" | "viewer"
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
}

// Create the handler
const handler = NextAuth(authOptions)

// Export for app directory
export { handler as GET, handler as POST }
