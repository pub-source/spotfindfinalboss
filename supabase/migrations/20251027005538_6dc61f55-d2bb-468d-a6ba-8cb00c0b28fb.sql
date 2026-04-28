-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create tourist_spots table
CREATE TABLE public.tourist_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  image_url TEXT,
  location TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  price_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.tourist_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tourist spots"
ON public.tourist_spots FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage tourist spots"
ON public.tourist_spots FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create accommodations table
CREATE TABLE public.accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  image_url TEXT,
  location TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  price_per_night DECIMAL(10,2),
  amenities TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view accommodations"
ON public.accommodations FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage accommodations"
ON public.accommodations FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create cafes table
CREATE TABLE public.cafes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cuisine_type TEXT,
  image_url TEXT,
  location TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  price_range TEXT,
  opening_hours TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cafes"
ON public.cafes FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage cafes"
ON public.cafes FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create gallery table
CREATE TABLE public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gallery"
ON public.gallery FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage gallery"
ON public.gallery FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_tourist_spots_updated_at
BEFORE UPDATE ON public.tourist_spots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accommodations_updated_at
BEFORE UPDATE ON public.accommodations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cafes_updated_at
BEFORE UPDATE ON public.cafes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();