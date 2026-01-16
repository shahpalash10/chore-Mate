# 🚀 Deploy Chore Mate to Vercel

Complete guide to deploy your Chore Mate app to Vercel for production use.

## Prerequisites

- Vercel account (free) - [Sign up here](https://vercel.com/signup)
- Git installed on your machine
- GitHub account (or GitLab/Bitbucket)
- Supabase project already set up

---

## Step 1: Initialize Git Repository

If you haven't already, initialize a Git repository:

```bash
cd /Users/palashshah/chores
git init
git add .
git commit -m "Initial commit - Chore Mate app"
```

## Step 2: Push to GitHub

1. **Create a new GitHub repository:**
   - Go to [github.com/new](https://github.com/new)
   - Name it `choremato` (or whatever you prefer)
   - **Don't** initialize with README (we already have code)
   - Click "Create repository"

2. **Push your code:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/choremato.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com) and login**

2. **Click "Add New Project"**

3. **Import your GitHub repository:**
   - Find your `choremato` repository
   - Click "Import"

4. **Configure Project:**
   - **Framework Preset**: Should auto-detect as "Vite"
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Click "Deploy"**

Vercel will automatically build and deploy your app! 🎉

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy (from project directory)
cd /Users/palashshah/chores
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name? choremato
# - In which directory is your code? ./
# - Auto-detected settings? Yes

# For production deployment:
vercel --prod
```

---

## Step 4: Configure Email Redirect for Password Reset

After deployment, you need to update Supabase with your production URL:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your Vercel URL to **Redirect URLs**:
   ```
   https://your-app-name.vercel.app/**
   ```
4. Save changes

---

## Step 5: Test Your Deployment

1. Visit your Vercel URL: `https://your-app-name.vercel.app`
2. Test on mobile (open on your phone)
3. Test features:
   - ✅ Login
   - ✅ Sign up
   - ✅ Forgot password
   - ✅ Create tasks
   - ✅ Assign tasks
   - ✅ Complete tasks
   - ✅ Change password

---

## Mobile Testing

Your app is now mobile-optimized! Test on:

### iOS (Safari)
- Should work like a native app
- Can "Add to Home Screen" for quick access
- Touch gestures work smoothly

### Android (Chrome)
- Responsive design adapts to screen size
- Smooth scrolling and interactions
- Can install as PWA

---

## Updating Your Deployment

Whenever you make changes:

```bash
# Commit your changes
git add .
git commit -m "Your commit message"
git push

# Vercel automatically deploys!
```

Vercel will automatically build and deploy every time you push to your `main` branch.

---

## Custom Domain (Optional)

To use your own domain:

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update your DNS records as instructed
4. Wait for DNS propagation (can take up to 48 hours)

---

## Environment Variables (If Needed in Future)

Currently, Supabase credentials are in `index.html`. For better security in future:

1. In Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
3. Update code to use `import.meta.env.VITE_SUPABASE_URL`
4. Redeploy

---

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure `package.json` has correct dependencies
- Try building locally: `npm run build`

### App Doesn't Load
- Check browser console for errors
- Verify Supabase credentials are correct
- Check Vercel deployment logs

### Password Reset Email Link Doesn't Work
- Ensure you added Vercel URL to Supabase redirect URLs
- Format should be: `https://your-app.vercel.app/**`

---

## 🎉 Success!

Your Chore Mate app is now live and accessible from anywhere!

**Next Steps:**
- Share the URL with your team
- Add custom domain (optional)
- Monitor usage in Vercel analytics
- Enjoy managing your office chores! ✨

---

## Support

If you encounter issues:
1. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. Check Supabase docs: [supabase.com/docs](https://supabase.com/docs)
3. Review browser console for errors
