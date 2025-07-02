/**
 * Next.js Middleware with NextAuth v4 Integration
 * This middleware handles route protection and role-based access control
 * It runs before pages load to check authentication and authorization
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

/**
 * Main middleware function that protects routes based on authentication and roles
 * @param request - The incoming request
 * @returns NextResponse
 */
export async function middleware(request: NextRequest) {
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

  // Get the token to check authentication and role
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  // If no token, redirect to signin
  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url)
    signInUrl.searchParams.set("callbackUrl", request.url)
    return NextResponse.redirect(signInUrl)
  }

  /**
   * ROLE-BASED ACCESS CONTROL
   * Redirect viewers to posts page if they try to access restricted areas
   */
  const userRole = token.role as string
  const restrictedForViewers = [
    "/dashboard",
    "/posts/create",
    "/posts/edit",
    "/my-drafts",
    "/comment-moderation",
    "/user-management"
  ]

  // Check if viewer is trying to access restricted areas
  if (userRole === "viewer") {
    const isRestrictedRoute = restrictedForViewers.some(route => pathname.startsWith(route))
    if (isRestrictedRoute) {
      return NextResponse.redirect(new URL("/posts", request.url))
    }
  }

  // Allow access for authenticated users with proper permissions
  return NextResponse.next()
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
