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
  
  console.log(`🛡️ [MIDDLEWARE] Running for: ${pathname}`)
  console.log(`🛡️ [MIDDLEWARE] Full URL: ${request.url}`)

  /**
   * PUBLIC ROUTES - No authentication required
   * Allow access to auth pages and API routes only
   */
  const publicRoutes = ["/auth", "/api"]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // If the route is public, allow access
  if (isPublicRoute) {
    console.log(`✅ [MIDDLEWARE] Public route allowed: ${pathname}`)
    return NextResponse.next()
  }

  // Get the token to check authentication and role
  console.log(`🔍 [MIDDLEWARE] Checking authentication for: ${pathname}`)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  // If no token, redirect to signin
  if (!token) {
    console.log(`❌ [MIDDLEWARE] No token found, redirecting to signin from: ${pathname}`)
    const signInUrl = new URL("/auth/signin", request.url)
    signInUrl.searchParams.set("callbackUrl", request.url)
    return NextResponse.redirect(signInUrl)
  }

  /**
   * ROLE-BASED ACCESS CONTROL
   * Handle home page redirects and restricted areas for viewers
   */
  const userRole = token.role as string
  console.log(`👤 [MIDDLEWARE] User role: ${userRole} accessing: ${pathname}`)
  
  // Redirect home page based on user role
  if (pathname === "/") {
    if (userRole === "viewer") {
      console.log(`🏠 [MIDDLEWARE] Redirecting viewer from home to /posts`)
      return NextResponse.redirect(new URL("/posts", request.url))
    } else {
      console.log(`🏠 [MIDDLEWARE] Redirecting ${userRole} from home to /dashboard`)
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

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
      console.log(`🚫 [MIDDLEWARE] Viewer blocked from restricted route: ${pathname} → redirecting to /posts`)
      return NextResponse.redirect(new URL("/posts", request.url))
    }
    console.log(`✅ [MIDDLEWARE] Viewer allowed access to: ${pathname}`)
  }

  // Allow access for authenticated users with proper permissions
  console.log(`✅ [MIDDLEWARE] Access granted to ${userRole} for: ${pathname}`)
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
