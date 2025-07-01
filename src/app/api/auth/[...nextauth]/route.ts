/**
 * NextAuth API Route Handler
 * Compatible with Next.js 13+ App Directory and NextAuth v4
 * Uses the centralized auth configuration
 */

import authConfig from "@/lib/auth"

// Create the handler using the centralized config
const handler = authConfig

// Export for app directory
export { handler as GET, handler as POST }
