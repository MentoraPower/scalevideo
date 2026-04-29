-- Rode este SQL no Supabase SQL Editor (uma vez).
-- Idempotente: pode rodar em cima de versões anteriores.

-- 1) Tabela de projetos (cada projeto tem 2 links: upload e view)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists projects_slug_idx on public.projects (slug);

alter table public.projects enable row level security;

drop policy if exists "projects_select_anon" on public.projects;
create policy "projects_select_anon"
  on public.projects for select to anon, authenticated using (true);

drop policy if exists "projects_insert_anon" on public.projects;
create policy "projects_insert_anon"
  on public.projects for insert to anon, authenticated with check (true);

drop policy if exists "projects_update_anon" on public.projects;
create policy "projects_update_anon"
  on public.projects for update to anon, authenticated using (true) with check (true);

drop policy if exists "projects_delete_anon" on public.projects;
create policy "projects_delete_anon"
  on public.projects for delete to anon, authenticated using (true);

-- 2) Tabela de vídeos
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  storage_path text not null,
  sequence integer not null,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

alter table public.videos add column if not exists description text;
alter table public.videos add column if not exists project_id uuid references public.projects(id) on delete cascade;

create index if not exists videos_project_idx on public.videos (project_id);
create index if not exists videos_project_sequence_idx on public.videos (project_id, sequence);

alter table public.videos enable row level security;

drop policy if exists "videos_select_anon" on public.videos;
create policy "videos_select_anon"
  on public.videos for select to anon, authenticated using (true);

drop policy if exists "videos_insert_anon" on public.videos;
create policy "videos_insert_anon"
  on public.videos for insert to anon, authenticated with check (true);

drop policy if exists "videos_update_anon" on public.videos;
create policy "videos_update_anon"
  on public.videos for update to anon, authenticated using (true) with check (true);

drop policy if exists "videos_delete_anon" on public.videos;
create policy "videos_delete_anon"
  on public.videos for delete to anon, authenticated using (true);

-- 3) Bucket Storage com limite 2GB
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  true,
  2147483648,
  array['video/mp4','video/quicktime','video/x-matroska','video/webm','video/x-msvideo','video/*']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 4) Policies do Storage
drop policy if exists "videos_bucket_read" on storage.objects;
create policy "videos_bucket_read"
  on storage.objects for select to anon, authenticated using (bucket_id = 'videos');

drop policy if exists "videos_bucket_insert" on storage.objects;
create policy "videos_bucket_insert"
  on storage.objects for insert to anon, authenticated with check (bucket_id = 'videos');

drop policy if exists "videos_bucket_update" on storage.objects;
create policy "videos_bucket_update"
  on storage.objects for update to anon, authenticated using (bucket_id = 'videos') with check (bucket_id = 'videos');

drop policy if exists "videos_bucket_delete" on storage.objects;
create policy "videos_bucket_delete"
  on storage.objects for delete to anon, authenticated using (bucket_id = 'videos');
