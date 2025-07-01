/**
 * Home Page Component
 * Landing page for the Blog CMS application
 * Handles automatic redirection for authenticated users and showcases features
 */

"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Shield, Users, FileText, ArrowRight } from "lucide-react"
import { LoadingScreen } from "@/components/ui/loading-screen"

/**
 * Demo account information for display purposes
 */
const DEMO_ACCOUNTS = [
  {
    role: "Admin",
    email: "admin@company.com",
    color: "bg-red-50 text-red-700 border-red-200",
    description: "Full system access"
  },
  {
    role: "Editor", 
    email: "editor@company.com",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Content management"
  },
  {
    role: "Author",
    email: "author@company.com", 
    color: "bg-green-50 text-green-700 border-green-200",
    description: "Content creation"
  },
  {
    role: "Viewer",
    email: "viewer@company.com",
    color: "bg-gray-50 text-gray-700 border-gray-200", 
    description: "Read-only access"
  }
]

/**
 * Feature cards data for the landing page
 */
const FEATURES = [
  {
    icon: Shield,
    title: "Role-Based Access Control",
    description: "Four distinct roles with granular permissions: Admin, Editor, Author, and Viewer.",
    color: "text-blue-600"
  },
  {
    icon: FileText,
    title: "Rich Content Management", 
    description: "Create and edit blog posts with a modern interface supporting drafts and publishing.",
    color: "text-green-600"
  },
  {
    icon: Users,
    title: "User Management",
    description: "Comprehensive user management with role assignment and permission control.",
    color: "text-purple-600"
  },
  {
    icon: BookOpen,
    title: "Comment Moderation",
    description: "Comment moderation system with approval workflows and status management.",
    color: "text-orange-600"
  }
]

/**
 * Home Page Component
 * Displays landing page and redirects authenticated users to dashboard
 */
export default function Home() {
  // Get session data and loading state from NextAuth
  const { data: session, status } = useSession()
  const router = useRouter()

  /**
   * Effect to handle automatic redirection for authenticated users
   * Redirects to dashboard if user is already signed in
   */
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/dashboard")
    }
  }, [session, status, router])

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <LoadingScreen />
    )
  }

  // Don't render content if user is authenticated (will redirect)
  if (status === "authenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white rounded-full shadow-lg">
            <BookOpen className="h-16 w-16 text-blue-600" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Blog<span className="text-blue-600">CMS</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            A comprehensive Role-Based Access Control (RBAC) blog management system demonstrating 
            modern authentication, authorization, and content management with{" "}
            <span className="font-semibold text-blue-600">NextAuth.js</span> and{" "}
            <span className="font-semibold text-blue-600">PostgreSQL</span>.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Button asChild size="lg" className="group">
              <Link href="/auth/signin">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg">
              <Link href="#demo-accounts">
                View Demo Accounts
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {FEATURES.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
                <feature.icon className={`h-8 w-8 ${feature.color} mb-2`} />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
          ))}
        </div>

        {/* Demo Accounts Section */}
        <div id="demo-accounts" className="max-w-4xl mx-auto">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Demo Accounts</CardTitle>
              <CardDescription className="text-base">
                Try different roles to see how RBAC works in practice. Each role has different permissions and access levels.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Account Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {DEMO_ACCOUNTS.map((account, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${account.color} transition-all duration-200 hover:scale-105`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold text-lg">{account.role}</span>
                        <div className="text-sm opacity-75">{account.description}</div>
                      </div>
        </div>
                    <div className="text-sm font-mono bg-white/50 px-2 py-1 rounded">
                      {account.email}
                </div>
                </div>
                ))}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">How to Test:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Click "Get Started" to go to the sign-in page</li>
                  <li>Use any of the email addresses above</li>
                  <li>Enter any password (this is a demo environment)</li>
                  <li>Explore the dashboard with different role permissions</li>
                </ol>
                </div>

              {/* Tech Stack */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Built With:</h4>
                <div className="flex flex-wrap gap-2 text-sm">
                  {[
                    "Next.js 15", "NextAuth.js v5", "PostgreSQL", "Neon Database",
                    "Tailwind CSS", "TypeScript", "Radix UI", "Lucide Icons"
                  ].map((tech, index) => (
                    <span
                      key={index}
                      className="bg-white px-2 py-1 rounded border text-gray-600"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
          </CardContent>
        </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p className="text-sm">
            This is a demonstration application showcasing modern web development practices.
          </p>
        </div>
      </div>
    </div>
  )
}
