-- Drop problematic policies
DROP POLICY IF EXISTS "Parents can view children" ON profiles;
DROP POLICY IF EXISTS "Teachers can view students" ON profiles;

-- Re-apply simple policies
CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
