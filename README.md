# Next.js 14 + Supabase Authentication

A modern full-stack application built with Next.js 14, Supabase, and TypeScript featuring secure email/password authentication.

## Features

- ⚡ **Next.js 14** with App Router
- 🔐 **Supabase Authentication** (Email/Password)
- 📱 **Responsive Design** with Tailwind CSS
- 🛡️ **TypeScript** for type safety
- 🔄 **Middleware** for route protection
- 🎨 **Modern UI** components

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase account

### 1. Clone and Install

```bash
cd nextjs-supabase-auth
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to Settings > API
3. Copy your project URL and anon key

### 3. Configure Environment Variables

1. Copy the environment template:
```bash
cp .env.example .env.local
```

2. Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

3. Optional: Add OpenAI API key for AI photo analysis:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Set up the Database

1. Go to your Supabase dashboard
2. Navigate to the "SQL Editor"
3. Copy the contents of `database/schema.sql`
4. Paste and run the SQL commands to create the tables

### 5. Configure Supabase Authentication

In your Supabase dashboard:

1. Go to Authentication > Settings
2. Set **Site URL** to: `http://localhost:3000`
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - For production, add your domain: `https://yourdomain.com/auth/callback`

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── auth/              # Authentication routes
│   ├── dashboard/         # Protected dashboard
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── auth/             # Authentication components
│   └── layout/           # Layout components
├── lib/                  # Utility libraries
│   ├── supabase.ts       # Unified Supabase configuration
│   └── supabase/         # Legacy Supabase files (deprecated)
├── examples/              # Usage examples and patterns
├── database/              # Database schema and setup
└── middleware.ts         # Next.js middleware for auth
```

## Key Features

### Property Inspection Management

The application includes a complete property inspection system:

- **Inspection Form**: Create new property inspections with all required details
- **Inspection Types**: Support for entry, exit, and routine inspections
- **Database Integration**: Secure storage with Row Level Security (RLS)
- **User Management**: Each user can only access their own inspections

#### Creating an Inspection

1. Navigate to "New Inspection" in the navigation
2. Fill out the inspection form:
   - Property address
   - Inspection type (entry/exit/routine)
   - Owner name
   - Tenant name (optional)
   - Inspection date
3. Submit to save to Supabase

#### Database Structure

- **inspections** table: Main inspection records
- **inspection_items** table: Detailed checklist items (ready for future expansion)
- **Row Level Security**: Users can only access their own data

### Unified Supabase Module

The project includes a comprehensive `lib/supabase.ts` module that provides:

- **Context-aware client creation**: Automatically chooses the right implementation
- **Singleton pattern**: Prevents duplicate instances in client-side code
- **SSR support**: Proper server-side rendering with cookie handling
- **TypeScript support**: Full type safety with proper return types
- **Easy migration**: Backward compatibility with existing patterns

#### Usage Examples:

```typescript
// Client-side components
import { createClientSupabase } from '@/lib/supabase'
const supabase = createClientSupabase()

// Server components  
import { createServerSupabase } from '@/lib/supabase'
const supabase = await createServerSupabase()

// Universal usage
import { createSupabase } from '@/lib/supabase'
const supabase = createSupabase() // Auto-detects context
```

### Authentication Flow

1. **Sign Up**: Users can create accounts with email/password
2. **Email Verification**: Users receive confirmation emails
3. **Sign In**: Secure login with validated credentials
4. **Protected Routes**: Middleware protects authenticated pages
5. **Sign Out**: Secure session termination

### Security Features

- **Route Protection**: Middleware redirects unauthenticated users
- **Session Management**: Automatic token refresh
- **Type Safety**: Full TypeScript integration
- **Secure Cookies**: HTTP-only cookies for session storage

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `OPENAI_API_KEY` | OpenAI API key for photo analysis | Optional |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Update Supabase redirect URLs with your production domain

### Other Platforms

Ensure you:
1. Set all environment variables
2. Update Supabase Site URL and Redirect URLs
3. Use HTTPS in production

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Customization

- **Styling**: Modify Tailwind classes in components
- **Authentication**: Extend Supabase auth in `src/lib/supabase/`
- **Routes**: Add new pages in `src/app/`
- **Components**: Create reusable components in `src/components/`

## Support

For issues and questions:
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## License

MIT License - feel free to use this project as a starting point for your applications.