"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { FileText, MessageSquare, PlusCircle, Users, BarChart3 } from "lucide-react"

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
    name: "Create Post",
    href: "/posts/create",
    icon: PlusCircle,
    permission: PERMISSIONS.CREATE_POST,
  },
  {
    name: "Comments",
    href: "/comments",
    icon: MessageSquare,
    permission: PERMISSIONS.MODERATE_COMMENTS,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    permission: PERMISSIONS.MANAGE_USERS,
  },
]

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session?.user) return null

  const userRole = session.user.role as any

  return (
    <div className="w-64 bg-white border-r min-h-screen">
      <div className="p-6">
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
    </div>
  )
}
