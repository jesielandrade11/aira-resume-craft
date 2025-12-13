-- Add credits and subscription fields to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS unlimited_until TIMESTAMP WITH TIME ZONE;

-- Create processed_payments table to track Stripe transactions
CREATE TABLE IF NOT EXISTS public.processed_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL UNIQUE,
  package_id TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for processed_payments
ALTER TABLE public.processed_payments ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own payments
DROP POLICY IF EXISTS "Users can view their own payments" ON public.processed_payments;
CREATE POLICY "Users can view their own payments" 
ON public.processed_payments 
FOR SELECT 
USING (auth.uid() = user_id);

-- Only service role can insert/update payments (via Edge Function)
-- No insert/update policy for public/authenticated users needed as this is handled by backend
