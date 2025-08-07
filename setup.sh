#!/bin/bash

# Next.js + Supabase Setup Script
echo "🚀 Setting up Next.js + Supabase Authentication Project"
echo "============================================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ Created .env.local file"
else
    echo "⚠️  .env.local already exists, skipping..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate a secure secret
echo "🔐 Generating secure NEXTAUTH_SECRET..."
SECRET=$(openssl rand -base64 32)
if [ "$(uname)" = "Darwin" ]; then
    # macOS
    sed -i '' "s/your_nextauth_secret_here/$SECRET/" .env.local
else
    # Linux
    sed -i "s/your_nextauth_secret_here/$SECRET/" .env.local
fi

echo ""
echo "✅ Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Create a Supabase project at https://supabase.com"
echo "2. Copy your project URL and anon key"
echo "3. Update .env.local with your Supabase credentials:"
echo "   - NEXT_PUBLIC_SUPABASE_URL=your_project_url"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
echo "4. Configure Supabase Auth settings:"
echo "   - Site URL: http://localhost:3000"
echo "   - Redirect URL: http://localhost:3000/auth/callback"
echo "5. Run 'npm run dev' to start the development server"
echo ""
echo "📖 Read the README.md for detailed instructions"