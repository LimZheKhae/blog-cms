/**
 * Role-Based Access Control (RBAC) Utilities
 * This module provides functions for checking user permissions and roles
 * Used throughout the application to control access to features and UI elements
 */

/**
 * Available user roles in the system
 * Ordered from highest to lowest permissions
 */
export type UserRole = "admin" | "editor" | "author" | "viewer"

/**
 * Permission levels for different actions
 * Used to group related permissions together
 */
export type Permission = 
  | "read_posts"           // Can view published posts
  | "read_drafts"          // Can view draft posts
  | "create_posts"         // Can create new posts
  | "edit_posts"           // Can edit existing posts
  | "delete_posts"         // Can delete posts
  | "publish_posts"        // Can publish/unpublish posts
  | "moderate_comments"    // Can approve/reject comments
  | "delete_comments"      // Can delete comments
  | "manage_users"         // Can create/edit/delete users
  | "view_analytics"       // Can view site analytics
  | "manage_settings"      // Can modify site settings

/**
 * Constants for all permissions - used in components for easy reference
 */
export const PERMISSIONS = {
  READ_POSTS: "read_posts" as const,
  READ_DRAFTS: "read_drafts" as const,
  CREATE_POST: "create_posts" as const,
  EDIT_POSTS: "edit_posts" as const,
  DELETE_POSTS: "delete_posts" as const,
  PUBLISH_POSTS: "publish_posts" as const,
  MODERATE_COMMENTS: "moderate_comments" as const,
  DELETE_COMMENTS: "delete_comments" as const,
  MANAGE_USERS: "manage_users" as const,
  VIEW_ANALYTICS: "view_analytics" as const,
  MANAGE_SETTINGS: "manage_settings" as const,
} as const

/**
 * Role hierarchy definition
 * Higher roles inherit all permissions from lower roles
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 1,  // Lowest permissions
  author: 2,  // Can create content
  editor: 3,  // Can manage content
  admin: 4,   // Highest permissions
}

/**
 * Permission matrix defining what each role can do
 * True = permission granted, False = permission denied
 */
const ROLE_PERMISSIONS: Record<UserRole, Record<Permission, boolean>> = {
  // Viewer role - read-only access
  viewer: {
    read_posts: true,
    read_drafts: false,
    create_posts: false,
    edit_posts: false,
    delete_posts: false,
    publish_posts: false,
    moderate_comments: false,
    delete_comments: false,
    manage_users: false,
    view_analytics: false,
    manage_settings: false,
  },
  
  // Author role - can create and edit own content
  author: {
    read_posts: true,
    read_drafts: true,        // Can see their own drafts
    create_posts: true,
    edit_posts: true,         // Can edit their own posts
    delete_posts: false,      // Cannot delete posts
    publish_posts: false,     // Cannot publish posts
    moderate_comments: false,
    delete_comments: false,
    manage_users: false,
    view_analytics: false,
    manage_settings: false,
  },
  
  // Editor role - can manage content and moderate
  editor: {
    read_posts: true,
    read_drafts: true,
    create_posts: true,
    edit_posts: true,
    delete_posts: true,       // Can delete posts
    publish_posts: true,      // Can publish posts
    moderate_comments: true,  // Can moderate comments
    delete_comments: true,
    manage_users: false,      // Cannot manage users
    view_analytics: true,
    manage_settings: false,
  },
  
  // Admin role - full access to everything
  admin: {
    read_posts: true,
    read_drafts: true,
    create_posts: true,
    edit_posts: true,
    delete_posts: true,
    publish_posts: true,
    moderate_comments: true,
    delete_comments: true,
    manage_users: true,       // Can manage users
    view_analytics: true,
    manage_settings: true,    // Can modify settings
  },
}

/**
 * Check if a user has a specific permission
 * 
 * @param userRole - The user's role
 * @param permission - The permission to check
 * @returns boolean - True if user has permission, false otherwise
 * 
 * @example
 * ```typescript
 * const canCreatePosts = hasPermission("author", "create_posts") // true
 * const canManageUsers = hasPermission("author", "manage_users") // false
 * ```
 */
export function hasPermission(userRole: UserRole | undefined, permission: Permission): boolean {
  if (!userRole) {
    return false
  }
  
  return ROLE_PERMISSIONS[userRole]?.[permission] ?? false
}

/**
 * Check if a user has ANY of the specified permissions
 * Useful for checking multiple related permissions at once
 * 
 * @param userRole - The user's role
 * @param permissions - Array of permissions to check
 * @returns boolean - True if user has at least one permission
 * 
 * @example
 * ```typescript
 * const canEditContent = hasAnyPermission("editor", ["create_posts", "edit_posts"])
 * ```
 */
export function hasAnyPermission(userRole: UserRole | undefined, permissions: Permission[]): boolean {
  if (!userRole) {
    return false
  }
  
  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * Check if a user has ALL of the specified permissions
 * Useful for checking that a user meets all requirements for an action
 * 
 * @param userRole - The user's role
 * @param permissions - Array of permissions to check
 * @returns boolean - True if user has all permissions
 * 
 * @example
 * ```typescript
 * const canFullyManageContent = hasAllPermissions("admin", ["create_posts", "edit_posts", "delete_posts"])
 * ```
 */
export function hasAllPermissions(userRole: UserRole | undefined, permissions: Permission[]): boolean {
  if (!userRole) {
    return false
  }
  
  return permissions.every(permission => hasPermission(userRole, permission))
}

/**
 * Check if a user's role is at least the specified minimum role
 * Uses role hierarchy to determine if user has sufficient permissions
 * 
 * @param userRole - The user's current role
 * @param minimumRole - The minimum required role
 * @returns boolean - True if user role meets or exceeds minimum
 * 
 * @example
 * ```typescript
 * const canAccessEditorFeatures = hasMinimumRole("editor", "author") // true
 * const canAccessAdminFeatures = hasMinimumRole("editor", "admin")   // false
 * ```
 */
export function hasMinimumRole(userRole: UserRole | undefined, minimumRole: UserRole): boolean {
  if (!userRole) {
    return false
  }
  
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole]
}

/**
 * Get all permissions for a specific role
 * Useful for debugging or displaying user capabilities
 * 
 * @param userRole - The user's role
 * @returns Array of permission names the user has
 * 
 * @example
 * ```typescript
 * const editorPermissions = getUserPermissions("editor")
 * // Returns: ["read_posts", "read_drafts", "create_posts", ...]
 * ```
 */
export function getUserPermissions(userRole: UserRole | undefined): Permission[] {
  if (!userRole) {
    return []
  }
  
  const rolePermissions = ROLE_PERMISSIONS[userRole]
  return (Object.keys(rolePermissions) as Permission[]).filter(
    permission => rolePermissions[permission]
  )
}

/**
 * Check if a user can perform content actions (create, edit, delete)
 * Convenience function for common content management checks
 * 
 * @param userRole - The user's role
 * @returns boolean - True if user can manage content
 */
export function canManageContent(userRole: UserRole | undefined): boolean {
  return hasAnyPermission(userRole, ["create_posts", "edit_posts", "delete_posts"])
}

/**
 * Check if a user can moderate the community (comments, users)
 * Convenience function for moderation permission checks
 * 
 * @param userRole - The user's role
 * @returns boolean - True if user can moderate
 */
export function canModerate(userRole: UserRole | undefined): boolean {
  return hasAnyPermission(userRole, ["moderate_comments", "manage_users"])
}

/**
 * Check if a user is an administrator
 * Convenience function for admin-only features
 * 
 * @param userRole - The user's role
 * @returns boolean - True if user is admin
 */
export function isAdmin(userRole: UserRole | undefined): boolean {
  return userRole === "admin"
}

/**
 * Get a human-readable description of a role
 * Useful for displaying role information in the UI
 * 
 * @param role - The role to describe
 * @returns string - Human-readable role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    admin: "Full access to all features and settings",
    editor: "Can manage content, moderate comments, and view analytics",
    author: "Can create and edit posts, view drafts",
    viewer: "Can view published content only"
  }
  
  return descriptions[role]
}

/**
 * Get the role hierarchy level for sorting or comparison
 * Higher numbers indicate higher permissions
 * 
 * @param role - The role to get level for
 * @returns number - Role hierarchy level
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role]
}
