create table public.emotion_corner_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  corner_key text not null,
  event_type text not null check (event_type in ('open','cta_click','random_quote')),
  cta_label text,
  cta_target text,
  cta_index integer,
  created_at timestamptz not null default now()
);

create index emotion_corner_events_corner_idx on public.emotion_corner_events (corner_key, created_at desc);
create index emotion_corner_events_user_idx on public.emotion_corner_events (user_id, created_at desc);

alter table public.emotion_corner_events enable row level security;

create policy "insert own emotion corner event"
  on public.emotion_corner_events for insert to authenticated
  with check (user_id = auth.uid());

create policy "select own or admin emotion corner event"
  on public.emotion_corner_events for select to authenticated
  using (user_id = auth.uid() or has_role(auth.uid(), 'admin'));

create policy "admin delete emotion corner event"
  on public.emotion_corner_events for delete to authenticated
  using (has_role(auth.uid(), 'admin'));