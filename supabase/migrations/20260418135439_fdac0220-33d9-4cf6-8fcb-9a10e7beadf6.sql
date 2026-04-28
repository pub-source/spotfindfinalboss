INSERT INTO storage.buckets (id, name, public)
VALUES ('places', 'places', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view place images"
ON storage.objects FOR SELECT
USING (bucket_id = 'places');

CREATE POLICY "Admins can upload place images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'places' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update place images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'places' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete place images"
ON storage.objects FOR DELETE
USING (bucket_id = 'places' AND has_role(auth.uid(), 'admin'::app_role));