-- Allow users to insert their own login history
CREATE POLICY "Users can insert their own login history"
ON public.user_login_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);