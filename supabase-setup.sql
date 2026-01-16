-- ============================================================================
-- SUPABASE DATABASE SETUP FOR CHOREMATO APP
-- ============================================================================
-- Execute this SQL in your Supabase SQL Editor
-- ============================================================================

-- 1. CREATE TABLES
-- ============================================================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  due_time TEXT,
  due_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  assigned_to_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(is_completed);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 4. DROP EXISTING POLICIES (IF RE-RUNNING)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can read users" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

DROP POLICY IF EXISTS "Users can view their assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can update tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON tasks;
DROP POLICY IF EXISTS "Employees can update their tasks" ON tasks;

-- 5. CREATE RLS POLICIES
-- ============================================================================

-- Users Table Policies
CREATE POLICY "Anyone can read users" 
  ON users FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Tasks Table Policies

-- Employees can view tasks assigned to them
CREATE POLICY "Users can view their assigned tasks" 
  ON tasks FOR SELECT 
  USING (
    assigned_to_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Only admins can insert tasks
CREATE POLICY "Admins can insert tasks" 
  ON tasks FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Admins can update any task, employees can update their own tasks
CREATE POLICY "Admins can update tasks" 
  ON tasks FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Employees can update their tasks" 
  ON tasks FOR UPDATE 
  USING (assigned_to_id = auth.uid());

-- Only admins can delete tasks
CREATE POLICY "Admins can delete tasks" 
  ON tasks FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 6. CREATE FUNCTION TO AUTO-UPDATE updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. CREATE TRIGGER FOR AUTO-UPDATING updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;

CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MANUAL STEPS AFTER RUNNING THIS SQL:
-- ============================================================================
-- 
-- 1. Create Admin Account in Supabase Auth Dashboard:
--    - Go to Authentication > Users > Add User
--    - Email: admin@yourdomain.com (or your preferred admin email)
--    - Password: [Choose a strong password]
--    - Auto Confirm User: YES
-- 
-- 2. Get the Admin User's UUID from Supabase Auth Dashboard
--
-- 3. Run this SQL to create admin profile (replace [ADMIN_UUID] and email):
--
--    INSERT INTO users (id, email, name, role) 
--    VALUES (
--      '[ADMIN_UUID]',
--      'admin@yourdomain.com',
--      'Admin',
--      'admin'
--    );
--
-- ============================================================================
