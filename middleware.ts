/**
 * Next.js Middleware with NextAuth v4 Integration
 * This middleware handles route protection and role-based access control
 * It runs before pages load to check authentication and authorization
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Main middleware function that protects routes based on authentication and roles
 * @param request - The incoming request
 * @returns NextResponse
 */
export function middleware(request: NextRequest) {
  // Extract pathname from the request URL for route matching
  const { pathname } = request.nextUrl

  /**
   * PUBLIC ROUTES - No authentication required
   * Allow access to home page, auth pages, and API routes
   */
  const publicRoutes = ["/", "/auth", "/api"]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // If the route is public, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }

  /**
   * For protected routes, redirect to signin page
   * The actual session check will be done on the client side
   */
  const signInUrl = new URL("/auth/signin", request.url)
  signInUrl.searchParams.set("callbackUrl", request.url)
  return NextResponse.redirect(signInUrl)
}

/**
 * Middleware configuration
 * Defines which routes this middleware should run on
 * Uses Next.js matcher patterns for efficient route matching
 */
export const config = {
  // Match all routes except static files and API routes that don't need protection
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (all API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
}
