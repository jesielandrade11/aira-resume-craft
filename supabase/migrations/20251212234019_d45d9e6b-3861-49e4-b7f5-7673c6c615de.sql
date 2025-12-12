-- Add credits column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 5;

-- Add is_unlimited column for unlimited subscription
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN DEFAULT false;

-- Add unlimited_until column for subscription end date
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS unlimited_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update the handle_new_user function to include credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name, credits)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name', 5);
  RETURN NEW;
END;
$$;