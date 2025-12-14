-- Create table for chat messages per resume
CREATE TABLE public.resume_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint for one chat per resume
ALTER TABLE public.resume_chats ADD CONSTRAINT resume_chats_resume_id_key UNIQUE (resume_id);

-- Enable RLS
ALTER TABLE public.resume_chats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own resume chats"
ON public.resume_chats
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resume chats"
ON public.resume_chats
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume chats"
ON public.resume_chats
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume chats"
ON public.resume_chats
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_resume_chats_updated_at
BEFORE UPDATE ON public.resume_chats
FOR EACH ROW
EXECUTE FUNCTION public.update_resumes_updated_at();