# Google OAuth Setup Instructions

## 1. Get Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
5. Select **Web application** as the application type
6. Configure the OAuth consent screen if prompted

## 2. Configure OAuth Client

**Application Name:** Blog CMS

**Authorized JavaScript origins:**

```
http://localhost:3000
```

**Authorized redirect URIs:**

```
http://localhost:3000/api/auth/callback/google
```

## 3. Add Credentials to Environment Variables

Add these to your `.env.local` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

Replace `your_google_client_id_here` and `your_google_client_secret_here` with the actual values from Google Cloud Console.

## 4. Complete Environment Variables

Your complete `.env.local` should look like this:

```env
# Database Configuration
DATABASE_URL=postgresql://neondb_owner:npg_8XGzsKV2NWDZ@ep-empty-grass-a1exvy6d-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=VE4W+KnDVJLKweNw+xu5Xi6Cfj2VTy7S0lPW3nH2yeo=

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret

# Microsoft OAuth Configuration (existing)
AZURE_AD_CLIENT_ID=your_azure_client_id_here
AZURE_AD_CLIENT_SECRET=your_azure_client_secret_here
AZURE_AD_TENANT_ID=your_azure_tenant_id_here
```

## 5. Test the Integration

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/auth/signin`
3. Click "Sign in with Google"
4. Complete the OAuth flow
5. Check your database - a new user should be created automatically with:
   - Email from Google account
   - Name from Google account
   - Role set to 'viewer'
   - Avatar URL from Google profile

## Features

✅ **Automatic User Creation**: New Google users are automatically added to your database
✅ **Default Role**: All new Google users get 'viewer' role by default
✅ **Profile Data**: Email, name, and avatar are imported from Google
✅ **Secure**: Uses NextAuth.js for secure OAuth flow
✅ **Database Integration**: Seamlessly integrates with your existing user system

## Security Notes

- Keep your Google Client Secret secure and never commit it to version control
- The redirect URI must exactly match what you configured in Google Cloud Console
- Users created via Google OAuth will have 'viewer' role by default - you can manually upgrade their permissions in the database if needed
