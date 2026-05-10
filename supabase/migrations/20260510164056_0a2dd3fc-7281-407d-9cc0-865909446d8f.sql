
-- Site images: admin-managed gallery for arbitrary slots across the site
CREATE TABLE IF NOT EXISTS public.site_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot TEXT NOT NULL,           -- e.g. 'home_hero', 'about_gallery', 'podcast_cover_default'
  url TEXT NOT NULL,
  alt TEXT,
  caption TEXT,
  tag TEXT,                     -- optional category label
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_images_slot_sort ON public.site_images(slot, sort_order);

ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view site images" ON public.site_images
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin insert site image" ON public.site_images
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin update site image" ON public.site_images
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin delete site image" ON public.site_images
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_site_images_updated_at
  BEFORE UPDATE ON public.site_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
