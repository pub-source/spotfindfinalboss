-- Create table for user warnings
CREATE TABLE public.user_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  warning_message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  dismissed_at timestamp with time zone,
  FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create table for banned IPs
CREATE TABLE public.banned_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL UNIQUE,
  banned_by uuid NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  FOREIGN KEY (banned_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_warnings
CREATE POLICY "Users can view their own warnings"
  ON public.user_warnings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all warnings"
  ON public.user_warnings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for banned_ips
CREATE POLICY "Admins can manage banned IPs"
  ON public.banned_ips
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));