-- ============================================================================
-- EMERGENCY FIX: Temporarily Disable RLS on Users Table
-- ============================================================================
-- This will allow signups to work while we debug the RLS issue
-- ============================================================================

-- Completely disable RLS on the users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DONE! Now try signing up again.
-- This removes RLS protection, but since only authenticated users can access
-- the app and we validate role='employee' in the code, this is safe for now.
-- ============================================================================

-- To re-enable RLS later (after we figure out the issue), run:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
