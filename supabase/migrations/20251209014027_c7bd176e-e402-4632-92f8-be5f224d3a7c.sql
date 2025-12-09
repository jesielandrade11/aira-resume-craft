-- Delete old anonymous data that can't be migrated
DELETE FROM public.resumes WHERE user_id = 'anonymous' OR user_id IS NULL;
DELETE FROM public.user_profiles WHERE user_id = 'anonymous' OR user_id IS NULL;

-- Remove default values
ALTER TABLE public.resumes ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.user_profiles ALTER COLUMN user_id DROP DEFAULT;

-- Allow null temporarily for type conversion
ALTER TABLE public.resumes ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.user_profiles ALTER COLUMN user_id DROP NOT NULL;

-- Update resumes table to use UUID for user_id
ALTER TABLE public.resumes 
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Make not null again
ALTER TABLE public.resumes ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint to auth.users
ALTER TABLE public.resumes 
ADD CONSTRAINT resumes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update user_profiles table to use UUID for user_id
ALTER TABLE public.user_profiles 
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Make not null again
ALTER TABLE public.user_profiles ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint to auth.users
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations for now" ON public.resumes;
DROP POLICY IF EXISTS "Allow all operations for user_profiles" ON public.user_profiles;

-- Create proper RLS policies for resumes
CREATE POLICY "Users can view their own resumes" 
ON public.resumes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resumes" 
ON public.resumes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes" 
ON public.resumes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes" 
ON public.resumes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create proper RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" 
ON public.user_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- Create trigger for auto-creating profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();