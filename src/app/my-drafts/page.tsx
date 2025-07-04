"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Search, 
  Calendar, 
  Clock,
  Edit3,
  ArrowRight,
  FileEdit,
  PlusCircle,
  Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { toast } from "react-toastify"
import { Navbar } from "@/components/layout/navbar"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

interface DraftPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  created_at: string
  updated_at: string
  author_id: string
  author_name: string
  author_avatar?: string
  reading_time?: number
}

export default function MyDraftsPage() {
  const { data: session, status } = useSession()
  const [drafts, setDrafts] = useState<DraftPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [draftToDelete, setDraftToDelete] = useState<{ id: string; title: string } | null>(null)

  // Check authentication and permissions
  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      redirect("/auth/signin?callbackUrl=/my-drafts")
      return
    }

    // Only users with draft reading permissions can access drafts
    if (!hasPermission(session.user.role, PERMISSIONS.READ_DRAFTS)) {
      redirect("/posts")
      return
    }
  }, [session, status])

  const fetchMyDrafts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/posts?status=draft&limit=100")
      
      if (!response.ok) {
        throw new Error("Failed to fetch drafts")
      }

      const data = await response.json()
      
      if (data.success) {
        // Filter to only show current user's drafts (extra security)
        const userDrafts = data.posts.filter((post: DraftPost) => 
          post.author_id === session?.user?.id
        )
        setDrafts(userDrafts)
      } else {
        toast.error("Failed to load drafts")
        setDrafts([])
      }
    } catch (error) {
      console.error("Error fetching drafts:", error)
      toast.error("Error loading drafts")
      setDrafts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchMyDrafts()
    }
  }, [session])

  const handleDeleteDraft = async (draftId: string, title: string) => {
    setDraftToDelete({ id: draftId, title })
    setShowDeleteDialog(true)
    }

  const confirmDeleteDraft = async () => {
    if (!draftToDelete) return

    setDeleteLoading(draftToDelete.id)
    try {
      const response = await fetch(`/api/posts/manage/${draftToDelete.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Draft deleted successfully")
        await fetchMyDrafts() // Refresh the list
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to delete draft")
      }
    } catch (error) {
      console.error("Error deleting draft:", error)
      toast.error("Error deleting draft")
    } finally {
      setDeleteLoading(null)
      setDraftToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // Filter drafts based on search
  const filteredDrafts = drafts.filter(draft =>
    draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    draft.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle authentication states
  if (status === "loading" || loading) {
    return <LoadingScreen title="Loading Drafts" subtitle="Fetching your draft posts..." />
  }

  if (!session || !hasPermission(session.user.role, PERMISSIONS.READ_DRAFTS)) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-red-500 to-pink-500">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FileEdit className="h-8 w-8 text-yellow-300 mr-2" />
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                My Drafts
              </h1>
            </div>
            <p className="text-xl text-orange-100 max-w-3xl mx-auto leading-relaxed">
              Your work in progress. Draft, refine, and publish when you are ready.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Controls Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search drafts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/70 backdrop-blur-sm border-gray-200"
              />
            </div>

            {/* Create New Post Button */}
            <Link href="/posts/create">
              <Button className="bg-orange-600 hover:bg-orange-700">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Draft
              </Button>
            </Link>
          </div>
        </div>

        {/* Drafts Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredDrafts.length} draft{filteredDrafts.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Drafts Grid */}
        {filteredDrafts.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <FileEdit className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? "No drafts found" : "No drafts yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? "Try adjusting your search criteria." 
                : "Start writing your first draft post!"
              }
            </p>
            {!searchTerm && (
              <Link href="/posts/create">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Your First Draft
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrafts.map((draft) => (
              <Card 
                key={draft.id} 
                className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-gray-200 hover:border-orange-300"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Draft
                    </Badge>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {draft.reading_time || 1} min read
                    </div>
                  </div>
                  <CardTitle className="text-xl group-hover:text-orange-600 transition-colors line-clamp-2">
                    {draft.title}
                  </CardTitle>
                  <CardDescription className="text-sm line-clamp-3">
                    {draft.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={draft.author_avatar} />
                        <AvatarFallback>{draft.author_name?.charAt(0) || "A"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs text-gray-500">
                          Last edited: {formatDate(draft.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/posts/edit/${draft.id}`} className="flex-1">
                      <Button className="w-full group/btn bg-orange-600 hover:bg-orange-700">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Draft
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDraft(draft.id, draft.title)}
                      disabled={deleteLoading === draft.id}
                      className="px-3 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200"
                    >
                      {deleteLoading === draft.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Custom Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDeleteDraft}
        title="Delete Draft"
        message={
          draftToDelete 
            ? `Are you sure you want to delete "${draftToDelete.title}"? This action cannot be undone and the draft will be permanently removed.`
            : "Are you sure you want to delete this draft? This action cannot be undone."
        }
        confirmText="Delete Draft"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}