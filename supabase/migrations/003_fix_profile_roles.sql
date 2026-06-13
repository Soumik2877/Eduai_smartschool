-- Fix existing profiles by extracting role from auth metadata
UPDATE profiles p
SET role = COALESCE(
  (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE auth.users.id = p.id),
  'student'
)
WHERE role IS NULL OR role = 'student';
