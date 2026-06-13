-- Update user creation trigger to automatically link parent and child on parent signup
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

  -- 2. If the new user is a parent and provides a child enrollment number, link them
  IF (new.raw_user_meta_data->>'role' = 'parent') AND (new.raw_user_meta_data->>'child_enrollment_no' IS NOT NULL) THEN
    UPDATE public.profiles
    SET parent_id = new.id
    WHERE enrollment_no = new.raw_user_meta_data->>'child_enrollment_no';
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
