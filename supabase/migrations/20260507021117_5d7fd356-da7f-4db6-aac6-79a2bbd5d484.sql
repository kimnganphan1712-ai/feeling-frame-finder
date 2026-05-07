
-- Podcasts table
CREATE TABLE public.podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  long_description TEXT,
  audio_url TEXT,
  cover_image_url TEXT,
  host TEXT,
  duration_seconds INTEGER,
  published_at TIMESTAMPTZ,
  category TEXT NOT NULL DEFAULT 'general',
  emotion_tags TEXT[] NOT NULL DEFAULT '{}',
  mood_targets TEXT[] NOT NULL DEFAULT '{}',
  series TEXT,
  episode_number INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','public','private','scheduled')),
  healing_message TEXT,
  transcript TEXT,
  content_source TEXT,
  music_source TEXT,
  original_author TEXT,
  reference_link TEXT,
  self_produced BOOLEAN NOT NULL DEFAULT false,
  show_on_home BOOLEAN NOT NULL DEFAULT false,
  show_in_today BOOLEAN NOT NULL DEFAULT true,
  allow_favorite BOOLEAN NOT NULL DEFAULT true,
  allow_reactions BOOLEAN NOT NULL DEFAULT true,
  allow_comments BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_podcasts_status ON public.podcasts(status);
CREATE INDEX idx_podcasts_published_at ON public.podcasts(published_at DESC);
CREATE INDEX idx_podcasts_emotion_tags ON public.podcasts USING GIN(emotion_tags);
CREATE INDEX idx_podcasts_mood_targets ON public.podcasts USING GIN(mood_targets);

ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

-- Users can view public podcasts that are published; admins see all
CREATE POLICY "view visible podcasts" ON public.podcasts
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR (
    status = 'public'
    AND (published_at IS NULL OR published_at <= now())
  )
);

CREATE POLICY "admin insert podcast" ON public.podcasts
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "admin update podcast" ON public.podcasts
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "admin delete podcast" ON public.podcasts
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_podcasts_updated
BEFORE UPDATE ON public.podcasts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('podcast-media', 'podcast-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "podcast media public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'podcast-media');

CREATE POLICY "podcast media admin insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'podcast-media' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "podcast media admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'podcast-media' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "podcast media admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'podcast-media' AND has_role(auth.uid(), 'admin'));
