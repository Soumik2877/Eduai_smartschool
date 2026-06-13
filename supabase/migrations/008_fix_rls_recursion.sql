-- 1. Use PL/pgSQL to dynamically find and drop EVERY policy on the profiles table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 2. Define helper function that reads role from JWT user metadata (bypasses database query entirely!)
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text AS $$
  SELECT coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'student');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.is_parent_of(parent_uid uuid, child_uid uuid)
RETURNS boolean AS $$
DECLARE
  is_parent boolean;
BEGIN
  -- This query runs with SECURITY DEFINER privileges. 
  -- Since profiles policies no longer query profiles, this runs safely without recursion.
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = child_uid AND parent_id = parent_uid
  ) INTO is_parent;
  RETURN is_parent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Apply clean, recursion-free policies on profiles
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Parents can view child profiles" ON profiles
FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Teachers can view student profiles" ON profiles
FOR SELECT USING (
  get_auth_role() = 'teacher' AND role = 'student'
);

-- 4. Clean and apply policies for other tables to ensure they don't cause recursion

-- assignments
DROP POLICY IF EXISTS "Teachers can manage assignments" ON assignments;
DROP POLICY IF EXISTS "Parents can view child assignments" ON assignments;

CREATE POLICY "Teachers can manage assignments" ON assignments
FOR ALL USING (
  get_auth_role() = 'teacher'
);

CREATE POLICY "Parents can view child assignments" ON assignments
FOR SELECT USING (
  is_parent_of(auth.uid(), user_id)
);

-- exams
DROP POLICY IF EXISTS "Teachers can manage exams" ON exams;
DROP POLICY IF EXISTS "Parents can view child exams" ON exams;

CREATE POLICY "Teachers can manage exams" ON exams
FOR ALL USING (
  get_auth_role() = 'teacher'
);

CREATE POLICY "Parents can view child exams" ON exams
FOR SELECT USING (
  is_parent_of(auth.uid(), user_id)
);

-- quiz_sessions
DROP POLICY IF EXISTS "Teachers can manage quiz sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "Parents can view child quiz sessions" ON quiz_sessions;

CREATE POLICY "Teachers can manage quiz sessions" ON quiz_sessions
FOR ALL USING (
  get_auth_role() = 'teacher'
);

CREATE POLICY "Parents can view child quiz sessions" ON quiz_sessions
FOR SELECT USING (
  is_parent_of(auth.uid(), user_id)
);

-- focus_sessions
DROP POLICY IF EXISTS "Teachers can view focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Parents can view child focus sessions" ON focus_sessions;

CREATE POLICY "Teachers can view focus sessions" ON focus_sessions
FOR SELECT USING (
  get_auth_role() = 'teacher'
);

CREATE POLICY "Parents can view child focus sessions" ON focus_sessions
FOR SELECT USING (
  is_parent_of(auth.uid(), user_id)
);

-- performance_records
DROP POLICY IF EXISTS "Teachers can manage performance records" ON performance_records;
DROP POLICY IF EXISTS "Parents can view child performance records" ON performance_records;

CREATE POLICY "Teachers can manage performance records" ON performance_records
FOR ALL USING (
  get_auth_role() = 'teacher'
);

CREATE POLICY "Parents can view child performance records" ON performance_records
FOR SELECT USING (
  is_parent_of(auth.uid(), user_id)
);

-- study_sessions
DROP POLICY IF EXISTS "Teachers can view study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Parents can view child study sessions" ON study_sessions;

CREATE POLICY "Teachers can view study sessions" ON study_sessions
FOR SELECT USING (
  get_auth_role() = 'teacher'
);

CREATE POLICY "Parents can view child study sessions" ON study_sessions
FOR SELECT USING (
  is_parent_of(auth.uid(), user_id)
);

-- notifications
DROP POLICY IF EXISTS "Teachers can manage notifications" ON notifications;

CREATE POLICY "Teachers can manage notifications" ON notifications
FOR ALL USING (
  get_auth_role() = 'teacher'
);

-- subjects
DROP POLICY IF EXISTS "Teachers can view subjects" ON subjects;
DROP POLICY IF EXISTS "Parents can view child subjects" ON subjects;

CREATE POLICY "Teachers can view subjects" ON subjects
FOR SELECT USING (
  get_auth_role() = 'teacher'
);

CREATE POLICY "Parents can view child subjects" ON subjects
FOR SELECT USING (
  is_parent_of(auth.uid(), user_id)
);

-- 5. Enable RLS and add policies for notes and student_logs
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can manage notes" ON notes;
DROP POLICY IF EXISTS "Students can view notes" ON notes;
DROP POLICY IF EXISTS "Parents can view notes" ON notes;
DROP POLICY IF EXISTS "Teachers can manage student logs" ON student_logs;
DROP POLICY IF EXISTS "Students can view own logs" ON student_logs;
DROP POLICY IF EXISTS "Parents can view child logs" ON student_logs;

-- Notes policies
CREATE POLICY "Teachers can manage notes" ON notes
FOR ALL USING (
  get_auth_role() = 'teacher'
);

CREATE POLICY "Students can view notes" ON notes
FOR SELECT USING (
  get_auth_role() = 'student'
);

CREATE POLICY "Parents can view notes" ON notes
FOR SELECT USING (
  get_auth_role() = 'parent'
);

-- Student logs policies
CREATE POLICY "Teachers can manage student logs" ON student_logs
FOR ALL USING (
  get_auth_role() = 'teacher'
);

CREATE POLICY "Students can view own logs" ON student_logs
FOR SELECT USING (
  student_id = auth.uid()
);

CREATE POLICY "Parents can view child logs" ON student_logs
FOR SELECT USING (
  is_parent_of(auth.uid(), student_id)
);
