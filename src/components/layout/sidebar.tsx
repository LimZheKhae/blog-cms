"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { FileText, Shield, PlusCircle, Users, BarChart3, LogOut, User, FileEdit } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    permission: null,
  },
  {
    name: "All Posts",
    href: "/posts",
    icon: FileText,
    permission: null,
  },
  {
    name: "My Drafts",
    href: "/my-drafts",
    icon: FileEdit,
    permission: PERMISSIONS.CREATE_POST, // Only content creators can see drafts
  },
  {
    name: "Create Post",
    href: "/posts/create",
    icon: PlusCircle,
    permission: PERMISSIONS.CREATE_POST,
  },
  {
    name: "Comment Moderation",
    href: "/comment-moderation",
    icon: Shield,
    permission: PERMISSIONS.MODERATE_COMMENTS,
  },
  {
    name: "User Management",
    href: "/user-management",
    icon: Users,
    permission: PERMISSIONS.MANAGE_USERS,
  },
]

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin':
      return 'destructive'
    case 'editor':
      return 'default'
    case 'author':
      return 'secondary'
    case 'viewer':
      return 'outline'
    default:
      return 'outline'
  }
}

const handleSignOut = () => {
  signOut({ callbackUrl: '/auth/signin' })
}

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session?.user) return null

  const userRole = session.user.role as any

  return (
    <TooltipProvider>
      <div className="w-64 bg-white border-r min-h-screen flex flex-col">
        {/* Navigation Section */}
        <div className="flex-1 p-6">
          <nav className="space-y-2">
            {navigation.map((item) => {
              // Check if user has permission for this nav item
              if (item.permission && !hasPermission(userRole, item.permission)) {
                return null
              }

              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center justify-between">
            {/* User Info */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
                <AvatarImage 
                  src={session.user.image || undefined} 
                  alt={session.user.name || "User"} 
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium">
                  {session.user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.user.name || session.user.email}
                </p>
                <Badge 
                  variant={getRoleBadgeVariant(userRole)} 
                  className="text-xs capitalize mt-1"
                >
                  {userRole}
                </Badge>
              </div>
            </div>
            
            {/* Sign Out Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-sm">
                Sign Out
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
