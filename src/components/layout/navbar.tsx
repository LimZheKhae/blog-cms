"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { 
  Zap, 
  LogOut, 
  User, 
  PlusCircle, 
  Shield, 
  Users, 
  BarChart3,
  FileEdit,
  FileText,
  Sparkles
} from "lucide-react"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { cn } from "@/lib/utils"

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "editor":
        return "default"
      case "author":
        return "secondary"
      case "viewer":
        return "outline"
      default:
        return "outline"
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  const userRole = session?.user?.role as any

  // Early return if no session
  if (!session?.user) {
    return (
      <nav className="sticky top-0 z-50 border-b border-white/20 bg-gradient-to-r from-blue-50/95 via-white/95 to-purple-50/95 backdrop-blur-xl shadow-lg shadow-blue-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Zap className="h-7 w-7 text-blue-600" />
                <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Zenith
              </span>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/20 bg-gradient-to-r from-blue-50/95 via-white/95 to-purple-50/95 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-indigo-900/95 backdrop-blur-xl shadow-lg shadow-blue-500/5 dark:shadow-slate-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link 
              href={userRole === "viewer" ? "/posts" : "/dashboard"} 
              className="flex items-center space-x-2 group"
            >
              <div className="relative transition-transform group-hover:scale-110">
                <Zap className="h-7 w-7 text-blue-600" />
                <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Zenith
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {/* Posts - available to all */}
              <Link
                href="/posts"
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  pathname === "/posts" || pathname.startsWith("/posts/")
                    ? "bg-blue-100/80 text-blue-700 shadow-sm backdrop-blur-sm border border-blue-200/50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/60 hover:backdrop-blur-sm hover:border hover:border-gray-200/50"
                )}
              >
                <FileText className="h-4 w-4 mr-2" />
                Posts
              </Link>

              {/* Dashboard - not for viewers */}
              {userRole !== "viewer" && (
                <Link
                  href="/dashboard"
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    pathname === "/dashboard"
                      ? "bg-blue-100/80 text-blue-700 shadow-sm backdrop-blur-sm border border-blue-200/50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/60 hover:backdrop-blur-sm hover:border hover:border-gray-200/50"
                  )}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Right side - User Menu */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-blue-200 transition-all">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {session.user.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 border-2 border-white rounded-full"></div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm font-semibold leading-none">{session.user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                    <Badge variant={getRoleBadgeVariant(userRole)} className="w-fit capitalize font-medium">
                      {userRole}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Role-based Navigation Items */}
                {userRole !== "viewer" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <BarChart3 className="mr-3 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    {hasPermission(userRole, PERMISSIONS.CREATE_POST) && (
                      <DropdownMenuItem asChild>
                        <Link href="/posts/create" className="cursor-pointer">
                          <PlusCircle className="mr-3 h-4 w-4" />
                          <span>Create Post</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    {hasPermission(userRole, PERMISSIONS.READ_DRAFTS) && (
                      <DropdownMenuItem asChild>
                        <Link href="/my-drafts" className="cursor-pointer">
                          <FileEdit className="mr-3 h-4 w-4" />
                          <span>My Drafts</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    {hasPermission(userRole, PERMISSIONS.MODERATE_COMMENTS) && (
                      <DropdownMenuItem asChild>
                        <Link href="/comment-moderation" className="cursor-pointer">
                          <Shield className="mr-3 h-4 w-4" />
                          <span>Comment Moderation</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    {hasPermission(userRole, PERMISSIONS.MANAGE_USERS) && (
                      <DropdownMenuItem asChild>
                        <Link href="/user-management" className="cursor-pointer">
                          <Users className="mr-3 h-4 w-4" />
                          <span>User Management</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                  </>
                )}
                
                <DropdownMenuItem asChild>
                  <Link href="/posts" className="cursor-pointer">
                    <FileText className="mr-3 h-4 w-4" />
                    <span>All Posts</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 cursor-pointer">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
} 