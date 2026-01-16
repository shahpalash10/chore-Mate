#!/bin/bash

# ChoreMato Setup Script
# This script will help you set up the Supabase-based ChoreMato app

echo "🚀 ChoreMato Setup Script"
echo "=========================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Or if you have Node.js installed, make sure it's in your PATH"
    exit 1
fi

echo "✅ npm found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "⚠️  NEXT STEPS:"
echo "==============="
echo ""
echo "1. Set up your Supabase project:"
echo "   - Go to https://app.supabase.com"
echo "   - Create a new project"
echo ""
echo "2. Run the database setup:"
echo "   - Open supabase-setup.sql"
echo "   - Copy all SQL and run it in your Supabase SQL Editor"
echo ""
echo "3. Create admin account:"
echo "   - In Supabase: Authentication > Users > Add User"
echo "   - Copy the user UUID and insert into users table (see README)"
echo ""
echo "4. Configure the app:"
echo "   - Edit index.html"
echo "   - Replace __supabase_url and __supabase_anon_key"
echo ""
echo "5. Start the development server:"
echo "   npm run dev"
echo ""
echo "📖 For detailed instructions, see README.md"
