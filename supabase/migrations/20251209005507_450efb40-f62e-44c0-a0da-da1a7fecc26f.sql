-- Create user_profiles table for persistent user data
-- Migration already applied manually or via previous deploy
-- Skipping to avoid conflicts

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (same as resumes table)
CREATE POLICY "Allow all operations for user_profiles"
ON public.user_profiles
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_resumes_updated_at();