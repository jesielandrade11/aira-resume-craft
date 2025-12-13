-- Add photo column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS photo TEXT;