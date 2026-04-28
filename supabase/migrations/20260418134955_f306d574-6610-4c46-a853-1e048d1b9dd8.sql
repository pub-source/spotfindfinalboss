CREATE TABLE public.feedback_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feedback replies"
ON public.feedback_replies FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert their own reply"
ON public.feedback_replies FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reply"
ON public.feedback_replies FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reply"
ON public.feedback_replies FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any reply"
ON public.feedback_replies FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_feedback_replies_updated_at
BEFORE UPDATE ON public.feedback_replies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_feedback_replies_feedback_id ON public.feedback_replies(feedback_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_replies;
ALTER TABLE public.feedback_replies REPLICA IDENTITY FULL;