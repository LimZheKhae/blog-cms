import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { redirectUnauthorized } from '@/lib/auth-utils'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'

export default async function UserManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication and permissions
  const session = await getServerSession(authOptions) as any
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Only admins can access user management - redirect others to their appropriate page
  if (!hasPermission(session.user.role, PERMISSIONS.MANAGE_USERS)) {
    redirectUnauthorized(session.user.role)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">Manage user accounts, roles, and permissions</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  )
} 