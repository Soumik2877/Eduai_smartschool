-- 1. Alter profiles table to add custom identifiers
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS enrollment_no TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS teacher_id TEXT UNIQUE;

-- 2. Update user creation trigger to extract metadata fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    enrollment_no, 
    teacher_id
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', SPLIT_PART(new.email, '@', 1)), 
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'enrollment_no',
    new.raw_user_meta_data->>'teacher_id'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
