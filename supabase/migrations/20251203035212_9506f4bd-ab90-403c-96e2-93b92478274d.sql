-- Allow admins to delete user profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to clear old IP records (older than 24 hours)
CREATE OR REPLACE FUNCTION public.clear_old_login_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_login_history
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Enable pg_cron extension for scheduled cleanup
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Schedule the cleanup to run every hour (will delete records older than 24h)
SELECT cron.schedule(
  'clear-old-login-history',
  '0 * * * *',
  $$SELECT public.clear_old_login_history()$$
);