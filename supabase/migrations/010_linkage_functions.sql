-- 1. link_child_by_email
CREATE OR REPLACE FUNCTION public.link_child_by_email(child_email text)
RETURNS jsonb AS $$
DECLARE
  v_child_id uuid;
  v_child_name text;
  v_parent_role text;
BEGIN
  -- Get active user metadata role
  SELECT coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'student') INTO v_parent_role;
  IF v_parent_role <> 'parent' THEN
    RETURN jsonb_build_object('error', 'Only parents are authorized to link children.');
  END IF;

  -- Find student profile
  SELECT id, full_name INTO v_child_id, v_child_name 
  FROM public.profiles 
  WHERE lower(email) = lower(child_email) AND role = 'student'
  LIMIT 1;

  IF v_child_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No student account found with this email. Please verify the email and make sure the student has signed up first.');
  END IF;

  -- Link parent to child profile
  UPDATE public.profiles 
  SET parent_id = auth.uid() 
  WHERE id = v_child_id;

  RETURN jsonb_build_object('success', true, 'childId', v_child_id, 'childName', v_child_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. unlink_child_by_id
CREATE OR REPLACE FUNCTION public.unlink_child_by_id(child_uid uuid)
RETURNS jsonb AS $$
DECLARE
  v_parent_role text;
BEGIN
  SELECT coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'student') INTO v_parent_role;
  IF v_parent_role <> 'parent' THEN
    RETURN jsonb_build_object('error', 'Unauthorized.');
  END IF;

  UPDATE public.profiles 
  SET parent_id = NULL 
  WHERE id = child_uid AND parent_id = auth.uid();

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. link_parent_by_email
CREATE OR REPLACE FUNCTION public.link_parent_by_email(parent_email text)
RETURNS jsonb AS $$
DECLARE
  v_parent_id uuid;
  v_parent_name text;
  v_student_role text;
BEGIN
  SELECT coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'student') INTO v_student_role;
  IF v_student_role <> 'student' THEN
    RETURN jsonb_build_object('error', 'Only students are authorized to link parents.');
  END IF;

  -- Find parent profile
  SELECT id, full_name INTO v_parent_id, v_parent_name 
  FROM public.profiles 
  WHERE lower(email) = lower(parent_email) AND role = 'parent'
  LIMIT 1;

  IF v_parent_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No parent account found with this email. Please make sure the parent has registered first.');
  END IF;

  -- Link student to parent
  UPDATE public.profiles 
  SET parent_id = v_parent_id 
  WHERE id = auth.uid();

  RETURN jsonb_build_object('success', true, 'parentName', v_parent_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. unlink_parent
CREATE OR REPLACE FUNCTION public.unlink_parent()
RETURNS jsonb AS $$
DECLARE
  v_student_role text;
BEGIN
  SELECT coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'student') INTO v_student_role;
  IF v_student_role <> 'student' THEN
    RETURN jsonb_build_object('error', 'Unauthorized.');
  END IF;

  UPDATE public.profiles 
  SET parent_id = NULL 
  WHERE id = auth.uid();

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
