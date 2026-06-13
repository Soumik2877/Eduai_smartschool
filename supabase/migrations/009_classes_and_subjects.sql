-- 1. Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  school_id text DEFAULT 'EDUAI-DEMO',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- 2. Insert default classes
INSERT INTO public.classes (name, school_id) VALUES 
  ('Grade 9 Science', 'EDUAI-DEMO'),
  ('Grade 10 Mathematics', 'EDUAI-DEMO'),
  ('Grade 11 Physics', 'EDUAI-DEMO'),
  ('Grade 12 Chemistry', 'EDUAI-DEMO')
ON CONFLICT DO NOTHING;

-- 3. Add class_id to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL;

-- 4. Create teacher_classes table
CREATE TABLE IF NOT EXISTS public.teacher_classes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, class_id, subject_name)
);

-- Enable RLS on teacher_classes
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

-- 5. Add columns to notes and student_logs
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS subject_name text;

ALTER TABLE public.student_logs ADD COLUMN IF NOT EXISTS subject_name text;

-- 6. Define Policies for the new tables and columns

-- classes policies
DROP POLICY IF EXISTS "Allow authenticated read classes" ON public.classes;
DROP POLICY IF EXISTS "Allow public read classes" ON public.classes;
CREATE POLICY "Allow public read classes" ON public.classes 
FOR SELECT USING (true);

-- teacher_classes policies
DROP POLICY IF EXISTS "Teachers can manage own class mappings" ON public.teacher_classes;
CREATE POLICY "Teachers can manage own class mappings" ON public.teacher_classes 
FOR ALL USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Allow authenticated read teacher classes" ON public.teacher_classes;
CREATE POLICY "Allow authenticated read teacher classes" ON public.teacher_classes 
FOR SELECT TO authenticated USING (true);

-- Re-define notes policies so students and parents are restricted by class_id
DROP POLICY IF EXISTS "Students can view notes" ON notes;
CREATE POLICY "Students can view notes" ON notes 
FOR SELECT USING (
  get_auth_role() = 'student' 
  AND (class_id IS NULL OR class_id = (SELECT class_id FROM public.profiles WHERE id = auth.uid()))
);

DROP POLICY IF EXISTS "Parents can view notes" ON notes;
CREATE POLICY "Parents can view notes" ON notes 
FOR SELECT USING (
  get_auth_role() = 'parent' 
  AND (class_id IS NULL OR class_id IN (SELECT class_id FROM public.profiles WHERE parent_id = auth.uid()))
);

-- Update the new user trigger to populate class_id from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Insert the new profile row
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    enrollment_no, 
    teacher_id,
    class_id
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', SPLIT_PART(new.email, '@', 1)), 
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'enrollment_no',
    new.raw_user_meta_data->>'teacher_id',
    CASE 
      WHEN new.raw_user_meta_data->>'class_id' IS NOT NULL AND new.raw_user_meta_data->>'class_id' <> '' 
      THEN (new.raw_user_meta_data->>'class_id')::uuid 
      ELSE NULL 
    END
  );

  -- 2. If the new user is a parent and provides a child enrollment number, link them
  IF (new.raw_user_meta_data->>'role' = 'parent') AND (new.raw_user_meta_data->>'child_enrollment_no' IS NOT NULL) THEN
    UPDATE public.profiles
    SET parent_id = new.id
    WHERE enrollment_no = new.raw_user_meta_data->>'child_enrollment_no';
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
