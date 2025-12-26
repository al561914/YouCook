-- Storage bucket for recipe media
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-media', 'recipe-media', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload recipe media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own recipe media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recipe-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own recipe media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Anyone can view recipe media (public bucket)
CREATE POLICY "Anyone can view recipe media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recipe-media');
