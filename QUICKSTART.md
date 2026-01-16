# 🎯 QUICK START GUIDE - Chore Mate Supabase Migration

## ✅ What's Been Done

I've completely migrated your app from Firebase to Supabase! Here's what changed:

### Files Modified/Created:
- ✅ `package.json` - Replaced Firebase with Supabase SDK
- ✅ `work.jsx` - Complete rewrite with Supabase authentication & database
- ✅ `index.html` - Updated with Supabase config placeholders
- ✅ `supabase-setup.sql` - Complete database schema with RLS policies
- ✅ `README.md` - Comprehensive setup documentation
- ✅ `setup.sh` - Automated setup script

### Key Features Implemented:
- ✅ Email/password authentication via Supabase Auth
- ✅ Admin can only be created manually (not through signup)
- ✅ Employees can self-register through the app
- ✅ Admin can create tasks and assign to specific employees
- ✅ Employees ONLY see tasks assigned to them (enforced by RLS)
- ✅ Real-time updates when tasks are created/completed
- ✅ Task completion toggle
- ✅ Admin can view and delete all tasks

---

## 🚀 SETUP STEPS (DO THIS NOW)

### Step 1: Get Your Supabase Credentials

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create a new project (or use existing one)
3. Go to **Project Settings** → **API**
4. Copy these two values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon/public key** (the long string under "Project API keys")

### Step 2: Add Credentials to App

1. Open `/Users/palashshah/chores/index.html`
2. Find these lines (around line 8-9):
   ```javascript
   window.__supabase_url = "https://YOUR-PROJECT-ID.supabase.co";
   window.__supabase_anon_key = "YOUR-ANON-KEY-HERE";
   ```
3. Replace with your actual values:
   ```javascript
   window.__supabase_url = "https://abcdefgh.supabase.co";  // Your URL
   window.__supabase_anon_key = "eyJhbG...";  // Your anon key
   ```

### Step 3: Set Up Database

1. In Supabase Dashboard, go to **SQL Editor**
2. Open `/Users/palashshah/chores/supabase-setup.sql`
3. Copy ALL the SQL
4. Paste into Supabase SQL Editor
5. Click **Run**
6. You should see "Success. No rows returned"

### Step 4: Create Admin Account

#### 4a. Create Auth User
1. In Supabase, go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Enter:
   - Email: `admin@yourcompany.com` (or whatever you want)
   - Password: Choose a strong password
   - **Toggle "Auto Confirm User" to ON**
4. Click **Create User**
5. **COPY THE USER'S UUID** (you'll see it in the user list, looks like `a1b2c3d4-...`)

#### 4b. Create Admin Profile in Database
1. Go back to **SQL Editor**
2. Run this (replace `[PASTE-UUID-HERE]` and email):

```sql
INSERT INTO users (id, email, name, role) 
VALUES (
  '[PASTE-UUID-HERE]',
  'admin@yourcompany.com',
  'Admin',
  'admin'
);
```

### Step 5: Install Dependencies & Run

**If you have Node.js installed:**
```bash
cd /Users/palashshah/chores
npm install
npm run dev
```

**If you DON'T have Node.js:**
1. Download from [https://nodejs.org](https://nodejs.org)
2. Install it
3. Restart your terminal
4. Run the commands above

---

## 🎮 HOW TO USE

### Admin Flow:
1. Go to `http://localhost:5173` (after running `npm run dev`)
2. Login with admin email/password you created
3. You'll see "ADMIN" badge in header
4. Click employee avatars to assign tasks to them
5. Or click + button to create unassigned tasks
6. View all tasks (admin sees everything)
7. Delete tasks with trash icon

### Employee Flow:
1. Go to `http://localhost:5173`
2. Click "Sign up"
3. Enter name, email, password
4. After signup, you're logged in automatically
5. You'll ONLY see tasks assigned to you
6. Click checkmark to complete tasks

---

## 🔒 SECURITY FEATURES

- **Row Level Security (RLS)**: Employees can ONLY query their own tasks (enforced at database level)
- **Admin-only task creation**: Only admins can create/delete tasks (enforced by RLS policies)
- **No admin signup**: Admins must be created manually in Supabase (app doesn't allow it)

---

## ❓ TROUBLESHOOTING

### "Command not found: npm"
- Install Node.js from https://nodejs.org
- Make sure to restart your terminal after installation

### "Failed to load user profile"
- Make sure you ran BOTH parts of Step 4 (create auth user AND insert into users table)
- Check that the UUID matches

### Tasks not showing for employee
- Make sure the task is assigned to that specific employee
- Check the `assigned_to_id` in tasks table matches the employee's ID

### Admin can't see employees in the carousel
- Employees must sign up first
- After signup, they'll appear in the users list

---

## 📝 WHAT CHANGED FROM FIREBASE

| Feature | Firebase (Old) | Supabase (New) |
|---------|---------------|----------------|
| Auth | Anonymous + custom tokens | Email/Password |
| Database | Firestore | PostgreSQL |
| Security | Client-side filtering | Row Level Security (RLS) |
| Admin Creation | Could sign up as admin | Manual database creation only |
| Employee Visibility | Sometimes saw all tasks | ONLY sees assigned tasks |
| Real-time | Firestore onSnapshot | Supabase Realtime |

---

## 🎉 YOU'RE ALL SET!

Once you complete the setup steps above, your app will be fully functional with:
- ✅ Secure admin-only access
- ✅ Employee self-registration
- ✅ Task assignment to specific users
- ✅ Users only see their own tasks
- ✅ Real-time updates

**Need help?** Check `README.md` for more detailed info or Supabase docs at [supabase.com/docs](https://supabase.com/docs)
