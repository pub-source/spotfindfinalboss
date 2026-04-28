-- Create table for user ratings on tourist spots
CREATE TABLE public.spot_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spot_id uuid NOT NULL REFERENCES public.tourist_spots(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(spot_id, user_id)
);

-- Create table for view counts
CREATE TABLE public.spot_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spot_id uuid NOT NULL REFERENCES public.tourist_spots(id) ON DELETE CASCADE,
  user_id uuid,
  session_id text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spot_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spot_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for spot_ratings
CREATE POLICY "Anyone can view ratings"
ON public.spot_ratings
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert their own rating"
ON public.spot_ratings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rating"
ON public.spot_ratings
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for spot_views
CREATE POLICY "Anyone can view spot views"
ON public.spot_views
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert views"
ON public.spot_views
FOR INSERT
WITH CHECK (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE spot_ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE spot_views;