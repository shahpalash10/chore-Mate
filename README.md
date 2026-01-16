# Chore Mate - Office Chores Management App

A modern task management application built with React and Supabase, designed for office chore assignment and tracking.

## 🚀 Features

- **Admin Dashboard**: Admins can create and assign tasks to employees
- **Employee Portal**: Employees can view and complete assigned tasks
- **Real-time Updates**: Tasks update in real-time using Supabase subscriptions
- **Task Categories**: Organize tasks by Kitchen, Desk, Urgent, or General
- **Due Dates & Times**: Schedule tasks with specific dates and times
- **Modern UI**: Beautiful, responsive design with smooth animations

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js (v16 or higher)
- A Supabase account ([Sign up for free](https://supabase.com))

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd /Users/palashshah/chores
npm install
```

### 2. Set Up Supabase

#### Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details
4. Wait for the project to be ready

#### Run the Database Setup

1. In your Supabase project, go to the **SQL Editor**
2. Open the file `supabase-setup.sql` in this project
3. Copy all the SQL and paste it into the Supabase SQL Editor
4. Click "Run" to execute the SQL
5. This will create:
   - `users` table
   - `tasks` table
   - Row Level Security (RLS) policies
   - Necessary indexes and triggers

### 3. Create Admin Account

#### Step 1: Create Auth User
1. In Supabase Dashboard, go to **Authentication** > **Users**
2. Click **Add User** > **Create new user**
3. Enter admin email (e.g., `admin@yourcompany.com`)
4. Enter a strong password
5. **Important**: Toggle "Auto Confirm User" to **ON**
6. Click "Create User"
7. **Copy the User UID** (you'll see it in the users list)

#### Step 2: Create Admin Profile
1. Go back to **SQL Editor**
2. Run this SQL (replace `[ADMIN_UUID]` with the actual UUID you copied):

```sql
INSERT INTO users (id, email, name, role) 
VALUES (
  '[ADMIN_UUID]',
  'admin@yourcompany.com',
  'Admin',
  'admin'
);
```

### 4. Configure the App

1. In Supabase Dashboard, go to **Project Settings** > **API**
2. Copy your:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (the `anon` key)

3. Open `index.html` in this project
4. Replace the placeholders:

```javascript
window.__supabase_url = "YOUR_SUPABASE_URL_HERE";
window.__supabase_anon_key = "YOUR_ANON_KEY_HERE";
```

### 5. Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in your terminal).

## 👥 Usage

### For Admins

1. **Login**: Use the admin email and password you created
2. **Create Tasks**: Click the + button to create a new task
3. **Assign Tasks**: Select an employee from the carousel or leave unassigned
4. **Manage Tasks**: View all tasks and delete completed ones

### For Employees

1. **Sign Up**: Click "Sign up" on the login page
2. **Create Account**: Enter your name, email, and password
3. **View Tasks**: See only tasks assigned to you
4. **Complete Tasks**: Click the checkmark to mark tasks as complete

## 🔒 Security

- **RLS Policies**: Row Level Security ensures employees can only see their assigned tasks
- **Admin-Only Creation**: Only admins can create and delete tasks
- **Secure Authentication**: Powered by Supabase Auth with email/password

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL + Auth)
- **Real-time**: Supabase Realtime Subscriptions

## 📁 Project Structure

```
/Users/palashshah/chores/
├── index.html              # Main HTML with Supabase config
├── main.jsx               # React entry point
├── work.jsx               # Main app component
├── index.css              # Styles
├── supabase-setup.sql     # Database schema and RLS policies
├── package.json           # Dependencies
└── README.md              # This file
```

## 🐛 Troubleshooting

### "Failed to load user profile"
- Make sure you created the user profile in the `users` table
- Verify the UUID matches between Auth user and users table

### Tasks not showing up
- Check RLS policies are enabled
- For employees: Ensure tasks are assigned to your user ID
- For admins: Verify you're logged in with the admin account

### Real-time updates not working
- Make sure you're on the Supabase free tier or higher
- Check browser console for errors

## 📝 Notes

- **Admin accounts** must be created manually in Supabase (can't sign up through the app)
- **Employee accounts** can self-register through the app
- All data is stored in Supabase PostgreSQL
- RLS policies ensure data security

## 🚀 Deployment

To deploy to production:

1. Build the app:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your hosting service (Vercel, Netlify, etc.)

3. Make sure to update your Supabase credentials in `index.html` before building

---

**Need help?** Check the Supabase documentation at [supabase.com/docs](https://supabase.com/docs)
