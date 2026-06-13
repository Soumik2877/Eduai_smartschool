-- Create look up email by enrollment_no or teacher_id RPC function
CREATE OR REPLACE FUNCTION public.lookup_email_by_identifier(p_identifier text)
RETURNS text AS $$
DECLARE
  v_email text;
BEGIN
  -- Search for matching profiles
  SELECT email INTO v_email
  FROM public.profiles
  WHERE enrollment_no = p_identifier OR teacher_id = p_identifier
  LIMIT 1;

  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
