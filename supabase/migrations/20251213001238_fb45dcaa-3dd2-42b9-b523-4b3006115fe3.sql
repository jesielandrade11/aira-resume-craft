-- Create table to track processed payments and prevent replay attacks
CREATE TABLE public.processed_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  package_id TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.processed_payments ENABLE ROW LEVEL SECURITY;

-- Create index for fast lookups
CREATE INDEX idx_processed_payments_session_id ON public.processed_payments(stripe_session_id);
CREATE INDEX idx_processed_payments_user_id ON public.processed_payments(user_id);

-- RLS policy: Users can only view their own payment history
CREATE POLICY "Users can view their own payments"
ON public.processed_payments
FOR SELECT
USING (auth.uid() = user_id);

-- Note: INSERT is done by edge function using service role, so no INSERT policy needed for users