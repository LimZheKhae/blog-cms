/**
 * Sign In Page Component
 * Provides a custom authentication interface for the blog CMS
 * Handles credential-based authentication using NextAuth.js
 */

"use client"

import type React from "react"
import { signIn, getSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, AlertCircle } from "lucide-react"

/**
 * Demo user accounts for easy testing
 * Each account has different role permissions
 */
const DEMO_ACCOUNTS = [
  { email: "admin@company.com", role: "Admin", description: "Full access to all features" },
  { email: "editor@company.com", role: "Editor", description: "Can manage content and moderate comments" },
  { email: "author@company.com", role: "Author", description: "Can create and edit posts" },
  { email: "viewer@company.com", role: "Viewer", description: "Read-only access" },
]

/**
 * Sign In Component
 * Renders the authentication form and handles signin logic
 */
export default function SignIn() {
  // Form state management
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Next.js hooks for navigation and URL parameters
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get callback URL from search params (where to redirect after signin)
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  
  // Get error from search params (if redirected due to auth error)
  const urlError = searchParams.get("error")

  /**
   * Effect to check if user is already authenticated
   * Redirects to dashboard if already signed in
   */
  useEffect(() => {
    const checkAuth = async () => {
      const session = await getSession()
      if (session) {
        router.push(callbackUrl)
      }
    }
    checkAuth()
  }, [router, callbackUrl])

  /**
   * Effect to handle URL error parameters
   * Displays appropriate error messages based on middleware redirects
   */
  useEffect(() => {
    if (urlError) {
      switch (urlError) {
        case "insufficient-permissions":
          setError("You don't have permission to access that page.")
          break
        case "content-creation-not-allowed":
          setError("You don't have permission to create or edit content.")
          break
        case "moderation-not-allowed":
          setError("You don't have permission to moderate comments.")
          break
        case "user-management-not-allowed":
          setError("You don't have permission to manage users.")
          break
        default:
          setError("Authentication required.")
      }
    }
  }, [urlError])

  /**
   * Handle form submission
   * Validates input and attempts to sign in using NextAuth
   * @param e - Form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset error state
    setError("")

    // Validate email input
    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    // Set loading state
    setIsLoading(true)

    try {
      // Attempt to sign in using NextAuth credentials provider
      const result = await signIn("credentials", {
        email: email.trim(),
        password: password || "demo", // For demo, any password works
        redirect: false, // Handle redirect manually
      })

      if (result?.error) {
        // Handle authentication errors
        switch (result.error) {
          case "CredentialsSignin":
            setError("Invalid email address. Please check your email and try again.")
            break
          default:
            setError("An error occurred during sign in. Please try again.")
        }
      } else if (result?.ok) {
        // Successful authentication - redirect to callback URL
        router.push(callbackUrl)
        router.refresh() // Refresh to update session state
      }
    } catch (error) {
      console.error("Sign in error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle demo account quick login
   * Fills the email field with a demo account email
   * @param demoEmail - The demo account email to use
   */
  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail)
    setError("") // Clear any existing errors
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Main Sign In Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to access the Blog CMS
            </CardDescription>
        </CardHeader>
          
        <CardContent>
            {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Input (for demo purposes, any password works) */}
            <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter any password (demo)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <p className="text-xs text-gray-500">
                  For demo purposes, any password will work
                </p>
            </div>

              {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Microsoft Sign In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => signIn("azure-ad", { callbackUrl })}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#00A4EF" d="M0 0h12v12H0z"/>
              <path fill="#FFB900" d="M12 0h12v12H12z"/>
              <path fill="#00BCF2" d="M0 12h12v12H0z"/>
              <path fill="#40E0D0" d="M12 12h12v12H12z"/>
            </svg>
            Sign in with Microsoft
          </Button>
          
          </CardContent>
        </Card>

        {/* Demo Accounts Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Demo Accounts</CardTitle>
            <CardDescription>
              Click on any account below to quickly fill in the email field
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleDemoLogin(account.email)}
                  disabled={isLoading}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">{account.role}</div>
                      <div className="text-xs text-gray-600">{account.email}</div>
                    </div>
                    <div className="text-xs text-gray-500 max-w-32">
                      {account.description}
                    </div>
            </div>
                </button>
              ))}
          </div>
        </CardContent>
      </Card>

        {/* Additional Info */}
        <div className="text-center text-xs text-gray-500">
          This is a demo application. All accounts use the same password.
        </div>
      </div>
    </div>
  )
}
