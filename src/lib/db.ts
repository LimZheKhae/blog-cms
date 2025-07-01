import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export { sql }

export interface User {
  id: number
  email: string
  name: string
  role: "admin" | "editor" | "author" | "viewer"
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Post {
  id: number
  title: string
  slug: string
  content: string
  excerpt?: string
  status: "draft" | "published" | "archived"
  author_id: number
  author_name?: string
  created_at: string
  updated_at: string
}

export interface Comment {
  id: number
  content: string
  status: "pending" | "approved" | "rejected"
  post_id: number
  author_id: number
  author_name?: string
  created_at: string
  updated_at: string
}
