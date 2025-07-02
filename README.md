# Blog CMS - Role-Based Access Control System

A comprehensive blog content management system built with Next.js 14, featuring robust Role-Based Access Control (RBAC) and advanced comment moderation capabilities.

## 🚀 Features

### Core Features

- **Modern Blog System**: Create, edit, and publish blog posts with rich text editing
- **Role-Based Access Control**: Granular permissions system with 4 user roles
- **Comment System**: Real-time commenting with instant publication
- **Advanced Moderation**: Comprehensive comment moderation dashboard
- **User Management**: Complete user administration for admins
- **Responsive Design**: Mobile-first design with Tailwind CSS

### Authentication & Authorization

- **Dual Authentication**: Secure credential-based login + Google/Microsoft OAuth
- **Password Security**: Bcrypt hashing with salt rounds for credential accounts
- **Role-Based Permissions**: 4-tier permission system (Admin, Editor, Author, Viewer)
- **Protected Routes**: Automatic route protection based on user roles
- **Session Management**: Secure session handling with JWT tokens

### Comment Moderation System

- **Instant Comments**: Comments appear immediately without approval
- **Community Reporting**: Users can report inappropriate comments
- **Moderation Dashboard**: Comprehensive interface for managing reported content
- **Multiple Actions**: Hide, unhide, delete comments with audit trails
- **Detailed Reports**: View all reports with reasons and descriptions

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui (Radix UI Components)
- **Authentication**: NextAuth.js v4
- **Database**: PostgreSQL (Neon)
- **ORM**: Direct SQL queries with Neon serverless
- **Rich Text Editor**: TipTap with markdown support
- **Notifications**: Sonner Toast

### Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── comments/             # Comment management
│   │   ├── moderation/           # Moderation dashboard API
│   │   └── posts/                # Post management
│   ├── auth/                     # Authentication pages
│   ├── comment-moderation/       # Moderation dashboard
│   ├── dashboard/                # User dashboard
│   └── posts/                    # Blog post pages
├── components/                   # Reusable components
│   ├── layout/                   # Layout components
│   └── ui/                       # UI components (shadcn/ui)
├── lib/                          # Utility libraries
│   ├── auth.ts                   # NextAuth configuration
│   ├── db.ts                     # Database connection
│   ├── permissions.ts            # RBAC system
│   └── utils.ts                  # Utility functions
└── types/                        # TypeScript definitions
```

## 👥 User Roles & Permissions

### Role Hierarchy

1. **Admin** (Highest Permissions)

   - Full system access
   - User management
   - All content permissions
   - System settings

2. **Editor**

   - Content management
   - Comment moderation
   - Publish/unpublish posts
   - Analytics access

3. **Author**

   - Create and edit own posts
   - View drafts
   - Limited content access

4. **Viewer** (Lowest Permissions)
   - Read-only access
   - View published content only

### Permission Matrix

| Permission        | Viewer | Author | Editor | Admin |
| ----------------- | ------ | ------ | ------ | ----- |
| Read Posts        | ✅     | ✅     | ✅     | ✅    |
| Read Drafts       | ❌     | ✅     | ✅     | ✅    |
| Create Posts      | ❌     | ✅     | ✅     | ✅    |
| Edit Posts        | ❌     | ✅\*   | ✅     | ✅    |
| Delete Posts      | ❌     | ❌     | ✅     | ✅    |
| Publish Posts     | ❌     | ❌     | ✅     | ✅    |
| Moderate Comments | ❌     | ❌     | ✅     | ✅    |
| Delete Comments   | ❌     | ❌     | ✅     | ✅    |
| Manage Users      | ❌     | ❌     | ❌     | ✅    |
| View Analytics    | ❌     | ❌     | ✅     | ✅    |
| Manage Settings   | ❌     | ❌     | ❌     | ✅    |

\*Authors can only edit their own posts

## 🔒 Security Features

### Post Editing Security (STRICT RULES)

**Critical Security Implementation** to prevent unauthorized access and ensure content integrity:

#### 1. **Draft-Only Editing Policy**

- **Rule**: Only draft posts can be edited
- **Rationale**: Published posts are immutable to maintain content integrity
- **Enforcement**: Server-side validation in API routes + frontend checks

#### 2. **Ownership Verification**

- **Rule**: Users can only edit their own posts (regardless of role)
- **Scope**: Even administrators cannot edit other users' drafts
- **Purpose**: Prevents unauthorized content modification

#### 3. **Multi-Layer Security Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Middleware    │    │   API Routes     │    │   Frontend      │
│   Protection    │ -> │   Validation     │ -> │   Verification  │
│                 │    │                  │    │                 │
│ • Role check    │    │ • Ownership      │    │ • Error         │
│ • Route guard   │    │ • Draft status   │    │   handling      │
│ • Auth verify   │    │ • Permissions    │    │ • Redirects     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

#### 4. **Security Flow Example**

```typescript
// User attempts: /posts/edit/123 (not their post)

// Step 1: Middleware
✅ User authenticated with content creation role

// Step 2: API Route (/api/posts/manage/123)
❌ SELECT author_id FROM posts WHERE id = 123
❌ author_id !== session.user.id
❌ Return 403 Forbidden

// Step 3: Frontend
❌ Show error: "You can only edit your own draft posts"
❌ Redirect to /my-drafts
```

#### 5. **Error Handling & User Experience**

**Unauthorized Access Attempts Result In:**

- Clear, specific error messages
- Automatic redirection to appropriate pages
- No sensitive information disclosure
- Consistent user experience across all scenarios

**Error Messages:**

- `"You can only edit your own draft posts"`
- `"Only draft posts can be edited. Published posts cannot be modified"`
- `"Post not found"` (for non-existent posts)

## 🛡️ Comment Moderation System

### Workflow

1. **Instant Publication**: Comments appear immediately after submission
2. **Community Reporting**: Users can report inappropriate comments
3. **Moderation Review**: Editors/Admins review reported content
4. **Action Taken**: Hide, unhide, or delete comments as needed
5. **Audit Trail**: Complete history of moderation actions

### Moderation Dashboard Features

- **Statistics Overview**: Total comments, pending reports, hidden comments
- **Filtering System**: View by status (pending, reported, hidden, all)
- **Detailed Reports**: View all reports with reasons and descriptions
- **Bulk Actions**: Efficient handling of multiple comments
- **Audit Logs**: Track who performed what actions and when

### Report Categories

- **Spam**: Unwanted promotional content
- **Harassment**: Bullying or personal attacks
- **Inappropriate**: Content not suitable for the platform
- **Offensive**: Hate speech or offensive language
- **Misinformation**: False or misleading information
- **Other**: Custom reasons with descriptions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- Google OAuth credentials

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/blog-cms.git
   cd blog-cms
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@hostname/database"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"

   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Database Setup**

   ```bash
   # Run database migrations
   node scripts/complete-database-setup.js

   # Seed with sample data
   node scripts/execute-enhanced-seed.js

   # Add password authentication for demo users
   node scripts/run-password-migration.js
   ```

5. **Start Development Server**

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Sign in with Google to get started

## 📊 Database Schema

### Key Tables

- **users**: User accounts with roles
- **posts**: Blog posts with metadata
- **comments**: User comments with moderation fields
- **comment_reports**: Report tracking system

### Comment Moderation Fields

```sql
-- Comments table extensions for moderation
ALTER TABLE comments ADD COLUMN report_count INTEGER DEFAULT 0;
ALTER TABLE comments ADD COLUMN is_reported BOOLEAN DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN hidden_by INTEGER REFERENCES users(id);
ALTER TABLE comments ADD COLUMN hidden_at TIMESTAMP;
ALTER TABLE comments ADD COLUMN hidden_reason TEXT;
```

## 🔒 Security Features

### Authentication Security

- **OAuth Integration**: Secure Google OAuth implementation
- **Session Management**: Encrypted JWT tokens
- **CSRF Protection**: Built-in CSRF protection
- **Role Validation**: Server-side permission checking

### Data Protection

- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **Rate Limiting**: API endpoint protection
- **Audit Logging**: Complete action tracking

## 🎨 UI/UX Features

### Design System

- **Consistent Design**: Shadcn/ui component library
- **Responsive Layout**: Mobile-first approach
- **Accessibility**: WCAG 2.1 compliant
- **Dark Mode**: System preference detection

### User Experience

- **Toast Notifications**: Real-time feedback
- **Loading States**: Smooth user interactions
- **Error Handling**: Graceful error management
- **Progressive Enhancement**: Works without JavaScript

## 📱 API Documentation

### Authentication Required

All API endpoints require authentication except public post viewing.

### Key Endpoints

#### Posts

- `GET /api/posts` - List all posts
- `GET /api/posts/[slug]` - Get single post
- `POST /api/posts` - Create new post (Author+)
- `PATCH /api/posts/[id]` - Update post (Author+)
- `DELETE /api/posts/[id]` - Delete post (Editor+)

#### Comments

- `GET /api/comments` - List comments
- `POST /api/comments` - Create comment (Authenticated)
- `PATCH /api/comments/[id]` - Report/Hide comment
- `DELETE /api/comments/[id]` - Delete comment (Editor+)

#### Moderation

- `GET /api/moderation` - Get moderation data (Editor+)

## 🔧 Configuration

### Role Configuration

Modify roles and permissions in `src/lib/permissions.ts`:

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, Record<Permission, boolean>> = {
  // Customize permissions per role
};
```

### Navigation Setup

Update sidebar navigation in `src/components/layout/sidebar.tsx`:

```typescript
const navigation = [
  // Add/remove navigation items
];
```

## 🚀 Deployment

### Recommended Platforms

- **Vercel**: Optimized for Next.js
- **Netlify**: Great for static sites
- **Railway**: Full-stack deployment
- **AWS/GCP**: Enterprise solutions

### Environment Variables

Ensure all environment variables are set in production:

- Database connection string
- NextAuth configuration
- OAuth credentials

## 🧪 Testing

### Test Users

The system comes with pre-seeded demo accounts:

**Credential-based users (Password: Abcd1234):**

- **Admin**: admin@company.com
- **Editor**: editor@company.com
- **Author**: author@company.com
- **Viewer**: viewer@company.com

**OAuth users (Google/Microsoft login):**

- Additional users can be created via OAuth authentication

### Manual Testing

1. Test role-based access to different pages
2. Verify comment reporting and moderation
3. Check permission enforcement
4. Test OAuth authentication flow

## 📈 Monitoring & Analytics

### Built-in Analytics

- Comment moderation statistics
- User engagement metrics
- Content performance tracking

### Recommended Tools

- **Vercel Analytics**: Performance monitoring
- **Sentry**: Error tracking
- **PostHog**: User analytics
- **LogRocket**: Session replay

## 🤝 Contributing

### Development Guidelines

1. Follow TypeScript best practices
2. Use conventional commit messages
3. Write comprehensive tests
4. Update documentation

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team**: Amazing framework
- **Vercel**: Hosting and deployment
- **shadcn/ui**: Beautiful, accessible component library
- **Radix UI**: Unstyled, accessible UI primitives
- **Tailwind CSS**: Utility-first styling
- **NextAuth.js**: Authentication solution

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Join our community discussions

---

**Built with ❤️ using Next.js and modern web technologies**

## 🛡️ Security Features

### Post Editing Security (STRICT RULES)

**Critical Security Implementation** to prevent unauthorized access and ensure content integrity:

#### 1. **Draft-Only Editing Policy**

- **Rule**: Only draft posts can be edited
- **Rationale**: Published posts are immutable to maintain content integrity
- **Enforcement**: Server-side validation in API routes + frontend checks

#### 2. **Ownership Verification**

- **Rule**: Users can only edit their own posts (regardless of role)
- **Scope**: Even administrators cannot edit other users' drafts
- **Purpose**: Prevents unauthorized content modification

#### 3. **Multi-Layer Security Architecture**

```

```
