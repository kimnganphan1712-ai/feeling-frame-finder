-- 1. Role helper (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = _role
  )
$$;

-- 2. quotes
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  source_text text,
  author_name text,
  work_title text,
  note text,
  submitted_by uuid NOT NULL,
  display_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  reject_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_submitted_by ON public.quotes(submitted_by);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view approved quotes"
  ON public.quotes FOR SELECT TO authenticated
  USING (status = 'approved' OR submitted_by = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "submit own quote"
  ON public.quotes FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND length(trim(content)) > 0
    AND (
      (source_text IS NOT NULL AND length(trim(source_text)) > 0)
      OR (author_name IS NOT NULL AND length(trim(author_name)) > 0)
      OR (work_title IS NOT NULL AND length(trim(work_title)) > 0)
    )
  );

CREATE POLICY "admin update quote"
  ON public.quotes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "admin delete quote"
  ON public.quotes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR submitted_by = auth.uid());

-- 3. healing_works (admin-only authoring)
CREATE TABLE public.healing_works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('film','book','podcast','playlist','article','other')),
  thumbnail_url text,
  external_link text,
  tags text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.healing_works ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view published works"
  ON public.healing_works FOR SELECT TO authenticated
  USING (is_published OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "admin insert works"
  ON public.healing_works FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') AND created_by = auth.uid());

CREATE POLICY "admin update works"
  ON public.healing_works FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "admin delete works"
  ON public.healing_works FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- 4. albums
CREATE TABLE public.albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  cover_image_url text,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('public','private')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_albums_user ON public.albums(user_id);
CREATE INDEX idx_albums_visibility ON public.albums(visibility);

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view own or public albums"
  ON public.albums FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR visibility = 'public');

CREATE POLICY "create own album"
  ON public.albums FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "update own album"
  ON public.albums FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "delete own album"
  ON public.albums FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 5. album_items
CREATE TABLE public.album_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (album_id, quote_id)
);

CREATE INDEX idx_album_items_album ON public.album_items(album_id);

ALTER TABLE public.album_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view items of accessible albums"
  ON public.album_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.albums a
    WHERE a.id = album_items.album_id
      AND (a.user_id = auth.uid() OR a.visibility = 'public')
  ));

CREATE POLICY "add items to own album"
  ON public.album_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.albums a
    WHERE a.id = album_items.album_id AND a.user_id = auth.uid()
  ));

CREATE POLICY "remove items from own album"
  ON public.album_items FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.albums a
    WHERE a.id = album_items.album_id AND a.user_id = auth.uid()
  ));

-- 6. quote_favorites
CREATE TABLE public.quote_favorites (
  user_id uuid NOT NULL,
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, quote_id)
);

ALTER TABLE public.quote_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage own favorites select"
  ON public.quote_favorites FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "manage own favorites insert"
  ON public.quote_favorites FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "manage own favorites delete"
  ON public.quote_favorites FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 7. updated_at triggers
CREATE TRIGGER trg_quotes_updated BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_healing_works_updated BEFORE UPDATE ON public.healing_works
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_albums_updated BEFORE UPDATE ON public.albums
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vitamin-media','vitamin-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "vitamin media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vitamin-media');

CREATE POLICY "users upload own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vitamin-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "users update own files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vitamin-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "users delete own files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vitamin-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "admin upload healing folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vitamin-media'
    AND (storage.foldername(name))[1] = 'healing'
    AND public.has_role(auth.uid(),'admin')
  );

CREATE POLICY "admin manage healing folder update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'vitamin-media'
    AND (storage.foldername(name))[1] = 'healing'
    AND public.has_role(auth.uid(),'admin')
  );

CREATE POLICY "admin manage healing folder delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'vitamin-media'
    AND (storage.foldername(name))[1] = 'healing'
    AND public.has_role(auth.uid(),'admin')
  );