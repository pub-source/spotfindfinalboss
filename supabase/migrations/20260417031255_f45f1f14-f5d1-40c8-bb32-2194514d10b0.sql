-- Feedback table
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  user_email text NOT NULL,
  message text NOT NULL CHECK (char_length(message) > 0 AND char_length(message) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feedback"
  ON public.feedback FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert their own feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON public.feedback FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
  ON public.feedback FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any feedback"
  ON public.feedback FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Feedback likes table
CREATE TABLE public.feedback_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (feedback_id, user_id)
);

ALTER TABLE public.feedback_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feedback likes"
  ON public.feedback_likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like feedback"
  ON public.feedback_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own like"
  ON public.feedback_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Realtime
ALTER TABLE public.feedback REPLICA IDENTITY FULL;
ALTER TABLE public.feedback_likes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_likes;

CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX idx_feedback_likes_feedback_id ON public.feedback_likes(feedback_id);
CREATE INDEX idx_feedback_likes_user_id ON public.feedback_likes(user_id);