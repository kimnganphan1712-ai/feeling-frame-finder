-- Allow viewing public profile info (display_name, avatar) of other users
CREATE POLICY "Public profile info viewable by all authenticated"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);