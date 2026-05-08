
-- Storage bucket for project page media
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-page-media', 'project-page-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "project-page-media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-page-media');

CREATE POLICY "project-page-media admin write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-page-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "project-page-media admin update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'project-page-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "project-page-media admin delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'project-page-media' AND public.has_role(auth.uid(), 'admin'));

-- Sections table
CREATE TABLE public.project_page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text,
  subtitle text,
  description text,
  image_main text,
  image_secondary text,
  image_gallery text[] NOT NULL DEFAULT '{}',
  button_text text,
  button_link text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.project_page_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view sections" ON public.project_page_sections
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin insert sections" ON public.project_page_sections
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update sections" ON public.project_page_sections
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete sections" ON public.project_page_sections
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER project_page_sections_updated_at
  BEFORE UPDATE ON public.project_page_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Items table (messages, areas, mood labels, gallery)
CREATE TABLE public.project_page_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_slug text NOT NULL,
  kind text NOT NULL,
  title text,
  subtitle text,
  description text,
  image_url text,
  icon text,
  link text,
  color text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX project_page_items_section_idx ON public.project_page_items (section_slug, sort_order);

ALTER TABLE public.project_page_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view items" ON public.project_page_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin insert items" ON public.project_page_items
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update items" ON public.project_page_items
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete items" ON public.project_page_items
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER project_page_items_updated_at
  BEFORE UPDATE ON public.project_page_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Contact submissions table
CREATE TABLE public.project_contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  organization text,
  partnership_type text,
  message text NOT NULL,
  user_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone authenticated can submit contact" ON public.project_contact_submissions
  FOR INSERT TO authenticated WITH CHECK (
    char_length(btrim(name)) BETWEEN 1 AND 100
    AND char_length(btrim(email)) BETWEEN 3 AND 255
    AND char_length(btrim(message)) BETWEEN 1 AND 2000
  );
CREATE POLICY "admin view contact" ON public.project_contact_submissions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update contact" ON public.project_contact_submissions
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete contact" ON public.project_contact_submissions
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed sections
INSERT INTO public.project_page_sections (slug, title, subtitle, description, button_text, button_link, sort_order, extra) VALUES
('hero', 'Hospital Playlist', 'Trạm cứu hộ cảm xúc cho những ngày lòng mình mỏi mệt',
 'Một khoảng thở dịu dàng để bạn dừng lại, gọi tên cảm xúc, viết xuống những điều khó nói và tìm thấy vài lời nhắn đủ ấm để đi tiếp.',
 'Bắt đầu hành trình', '/', 10, '{}'::jsonb),
('why', 'Vì sao Hospital Playlist – Trạm cứu hộ cảm xúc ra đời?', NULL,
 'Có những ngày chúng ta không thật sự ổn, nhưng cũng không biết phải gọi tên điều đó như thế nào. Có những cảm xúc bị giấu đi vì sợ làm phiền người khác. Có những mệt mỏi không đủ lớn để gọi là tổn thương, nhưng vẫn khiến lòng mình nặng xuống. Hospital Playlist – Trạm cứu hộ cảm xúc ra đời như một nơi thật dịu dàng, nơi bạn không cần phải mạnh mẽ ngay lập tức. Bạn chỉ cần thành thật với cảm xúc của mình.',
 NULL, NULL, 20, '{}'::jsonb),
('founder', 'Người bắt đầu trạm cứu hộ cảm xúc này', NULL,
 'Founder bắt đầu dự án từ những ngày chính mình cũng đang học cách lắng nghe cảm xúc. Mong rằng nơi này sẽ là một góc nhỏ ấm áp dành cho bất cứ ai cần một khoảng dừng dịu dàng.',
 'Liên hệ hợp tác', '#contact', 30,
 '{"founder_name":"Phan Kim Ngân","founder_role":"Người sáng lập · Hospital Playlist","founder_quote":"Mình tin rằng ai cũng xứng đáng có một nơi để cảm xúc được lắng nghe.","secondary_button_text":"Đọc câu chuyện của founder","secondary_button_link":"#founder-story"}'::jsonb),
('messages', '5 lời nhắn từ trạm cứu hộ cảm xúc', NULL,
 'Những lời nhắn nhỏ gửi đến bạn — từ những người đã ghé qua trạm cứu hộ cảm xúc này.',
 NULL, NULL, 40, '{}'::jsonb),
('areas', 'Bên trong trạm cứu hộ cảm xúc có gì?', NULL,
 'Sáu khu vực nhỏ, mỗi nơi là một cách để bạn chăm sóc cảm xúc của chính mình.',
 NULL, NULL, 50, '{}'::jsonb),
('map', 'Bản đồ cảm xúc cộng đồng', NULL,
 'Mỗi cảm xúc được ghi nhận tại Hospital Playlist sẽ trở thành một chấm sáng nhỏ trên bản đồ cảm xúc. Khi nhiều người cùng chia sẻ, chúng ta sẽ nhìn thấy rằng mình không cô đơn — ngoài kia cũng có người đang vui, đang buồn, đang mỏi mệt, đang học cách chữa lành giống mình.',
 'Xem bản đồ cảm xúc', '/mood-board', 60, '{}'::jsonb),
('contact', 'Cùng Hospital Playlist tạo thêm nhiều khoảng thở dịu dàng', NULL,
 'Nếu bạn là người làm trong lĩnh vực giáo dục, sức khỏe tinh thần, sáng tạo nội dung, podcast, nghệ thuật hoặc cộng đồng, Hospital Playlist – Trạm cứu hộ cảm xúc luôn sẵn sàng lắng nghe những cơ hội hợp tác để lan tỏa nhiều hơn những điều chữa lành.',
 'Gửi lời nhắn', NULL, 70,
 '{"contact_email":"hello@hospitalplaylist.vn"}'::jsonb);

-- Seed 5 messages
INSERT INTO public.project_page_items (section_slug, kind, title, subtitle, description, sort_order) VALUES
('messages', 'message', 'Mai', 'Người từng cảm thấy lạc lối', 'Có những đêm chỉ cần biết ngoài kia có ai đó cũng đang thức cùng mình, lòng đã nhẹ hơn rất nhiều.', 10),
('messages', 'message', 'Linh', 'Sinh viên năm cuối', 'Mình học được rằng nghỉ một chút không phải là yếu đuối — đó là cách thương lấy chính mình.', 20),
('messages', 'message', 'Hà', 'Người mẹ trẻ', 'Trạm cứu hộ cảm xúc nhắc mình rằng: cảm xúc nào cũng xứng đáng được lắng nghe, kể cả của mình.', 30),
('messages', 'message', 'Phong', 'Người đang chữa lành', 'Mỗi ngày mình ghé qua đây như ghé một quán nhỏ quen — chỉ để hít một hơi thở thật chậm.', 40),
('messages', 'message', 'An', 'Một người lạ dịu dàng', 'Cảm ơn vì đã có một nơi không phán xét, chỉ ôm ấp những ngày mình không ổn lắm.', 50);

-- Seed 6 areas
INSERT INTO public.project_page_items (section_slug, kind, title, subtitle, description, link, icon, color, sort_order) VALUES
('areas', 'area', 'Phác đồ chữa lành', 'Dự án', 'Câu chuyện và hành trình của trạm cứu hộ cảm xúc.', '/about', 'Stethoscope', 'mint', 10),
('areas', 'area', 'Đơn thuốc tinh thần', 'Lời nhắn của bác sĩ', 'Những lời nhắn dịu dàng và toa thuốc tinh thần cho hôm nay.', '/prescription', 'Pill', 'blush', 20),
('areas', 'area', 'Tần số chữa lành', 'Postcard / Podcast', 'Nghe những âm thanh và lời thì thầm dịu lòng.', '/podcast', 'Headphones', 'mint', 30),
('areas', 'area', 'Dưỡng chất tinh thần', 'Vitamin', 'Bộ sưu tập câu nói và tác phẩm chữa lành.', '/vitamin', 'Sparkles', 'blush', 40),
('areas', 'area', 'Không gian kết nối', 'Cộng đồng', 'Nơi mọi người cùng chia sẻ cảm xúc.', '/mood-board', 'Globe2', 'mint', 50),
('areas', 'area', 'Hồ sơ cảm xúc', 'Nhật ký', 'Ghi lại những trang nhật ký của riêng bạn.', '/journal', 'BookHeart', 'blush', 60);

-- Seed mood labels
INSERT INTO public.project_page_items (section_slug, kind, title, color, sort_order) VALUES
('map', 'mood_label', 'Vui', '#FFD27F', 10),
('map', 'mood_label', 'Bình yên', '#A8DADC', 20),
('map', 'mood_label', 'Buồn', '#B8B8E8', 30),
('map', 'mood_label', 'Mỏi mệt', '#C8B8D8', 40),
('map', 'mood_label', 'Hy vọng', '#A8E6CF', 50);
