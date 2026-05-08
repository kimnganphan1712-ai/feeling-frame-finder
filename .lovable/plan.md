## Mục tiêu

Xây dựng lại trang "Phác đồ chữa lành" (`/about` mới hoặc thay thế trang dự án hiện tại) thành trang storytelling cảm xúc, **toàn bộ nội dung + ảnh do admin quản lý** qua dashboard. Thêm mục "Phác đồ chữa lành" vào **cuối** thanh công cụ (top nav / desktop nav, không đụng bottom nav 5 mục).

## Kiến trúc dữ liệu

### 1 storage bucket mới
- `project-page-media` (public) — chứa toàn bộ ảnh trang dự án (hero, founder, gallery, lời nhắn, card khu vực, bản đồ cảm xúc, form liên hệ, mascot phụ).

### 2 bảng mới
- `project_page_sections` — 1 hàng / 1 section, lưu các trường chung:
  - `id` uuid, `slug` text unique (hero, why, founder, messages, areas, map, contact)
  - `title`, `subtitle`, `description` text
  - `image_main`, `image_secondary` text (URL)
  - `image_gallery` text[]
  - `button_text`, `button_link` text
  - `extra` jsonb (cho nội dung riêng từng section: founder name/role/quote, contact email...)
  - `is_visible` boolean default true
  - `sort_order` int
  - `updated_at`, `updated_by`

- `project_page_items` — danh sách lặp (5 lời nhắn, 6 card khu vực, gallery items, nhãn cảm xúc của bản đồ...):
  - `id`, `section_slug` text (FK logic), `kind` text ('message' | 'area' | 'gallery' | 'mood_label')
  - `title`, `subtitle`, `description` text
  - `image_url` text, `icon` text, `link` text, `color` text
  - `extra` jsonb, `is_visible` bool, `sort_order` int

### Liên hệ hợp tác
- `project_contact_submissions` — lưu form gửi từ section "Liên hệ hợp tác":
  - name, email, organization, partnership_type, message, created_at
  - RLS: insert authenticated; select admin only.

### RLS
- Admin: full CRUD trên 2 bảng project_page_*.
- Authenticated: SELECT only (lấy `is_visible = true` ở client).
- `project_contact_submissions`: insert authenticated; select/update/delete admin.

### Seed
Migration seed các section mặc định + 5 message + 6 area card với nội dung mẫu trong brief.

## Frontend

### Route
- `src/routes/about.tsx` → path `/about` (slug "Phác đồ chữa lành"). Component fetch realtime qua supabase client; render từng section theo `sort_order` + `is_visible`.
- Sections (component riêng trong `src/components/about/`):
  - `HeroSection`
  - `WhySection` (2 cột: text + ảnh lớn + 1-2 ảnh nhỏ)
  - `FounderSection` (ảnh chân dung + gallery 2-4 ảnh + 2 CTA)
  - `MessagesSection` (5 card lời nhắn từ items)
  - `AreasSection` (grid 6 card khu vực từ items, link tới từng trang)
  - `MapSection` (ảnh chính + 2-3 ảnh phụ + nhãn cảm xúc)
  - `ContactSection` (form lưu vào `project_contact_submissions`)

### Style
- Pastel xanh trắng, gradient #EAF6F6 → #D6F0F0, accent #5EC2B7 (đã có trong design tokens mint).
- Card glass, bo góc lớn, shadow mềm, animation `fade-up`/`floating`.
- Placeholder ảnh đẹp khi chưa upload (gradient + icon mascot/Image).

### Navigation
- Thêm "Phác đồ chữa lành" vào **cuối** top desktop nav trong `src/routes/__root.tsx` (hoặc nơi đặt nav). KHÔNG đụng `BottomNav` (giữ 5 mục).

## Admin dashboard

### Route mới
- `src/routes/admin/project-page.tsx` — tab/section:
  - List sections theo `sort_order`, mỗi section accordion: chỉnh title/subtitle/description/buttons/visibility/order + uploader cho `image_main`, `image_secondary`, gallery (multi).
  - Quản lý items theo `kind` (messages, areas, mood_labels): add/edit/delete/reorder, mỗi item có image uploader.
  - Tab "Liên hệ nhận được": list `project_contact_submissions` (read-only, mark read).

### Reusable component
- `<ImageUploader bucket="project-page-media" value={url} onChange=...>` (re-dùng pattern hiện có trong admin/podcasts hoặc admin/healing).

### Admin dashboard entry
- Thêm card "Trang Phác đồ chữa lành" vào `src/routes/admin/dashboard.tsx` (cuối cùng).

## Kỹ thuật

- Migration: tạo bucket + 3 bảng + RLS + seed.
- Realtime không bắt buộc; dùng react-query để fetch trên cả `/about` và admin.
- Form contact: chèn vào `project_contact_submissions`, hiện toast cảm ơn.
- Responsive: mobile 1 cột, desktop 2 cột, grid card 2/3 cột tuỳ section.
- Không hard-code: mọi text/URL từ DB; fallback nhẹ nếu DB trống (hiển thị placeholder + mascot).
- Title nav: "Phác đồ chữa lành" → `/about`.

## Phạm vi không làm
- Không chỉnh `BottomNav` (giữ 5 mục mobile).
- Không đổi flow auth, mood check-in, prescription cũ.
- Không build drag-and-drop reorder phức tạp — dùng input number `sort_order` + nút lên/xuống đơn giản.
