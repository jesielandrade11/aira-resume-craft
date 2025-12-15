-- Drop legacy permissive policies if they exist
DROP POLICY IF EXISTS "Allow all operations for now" ON public.resumes;
DROP POLICY IF EXISTS "Allow all operations for user_profiles" ON public.user_profiles;