-- Fix Security Policies for resumes and user_profiles
-- Addresses Lovable/Supabase Security warnings:
-- 1. Customer Personal Information Could Be Stolen (user_profiles public)
-- 2. Payment Transaction History Could Be Accessed (user_profiles credits)
-- 3. User Resume Data Could Be Stolen (resumes public)
-- 1. Fix Resumes Table Policies
-- First, disable the permissive policy if it exists
DROP POLICY IF EXISTS "Allow all operations for now" ON public.resumes;
-- Create restrictive policies based on auth.uid()
CREATE POLICY "Users can view own resumes" ON public.resumes FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own resumes" ON public.resumes FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resumes" ON public.resumes FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resumes" ON public.resumes FOR DELETE USING (auth.uid() = user_id);
-- 2. Fix User Profiles Table Policies
-- Disable permissive policy
DROP POLICY IF EXISTS "Allow all operations for user_profiles" ON public.user_profiles;
-- Create restrictive policies (profile.id is the user_id)
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR
UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR
INSERT WITH CHECK (auth.uid() = id);
-- Note: user_profiles are usually created via trigger on auth.users, but INSERT policy allows manual creation if needed from client side logic that matches ID.