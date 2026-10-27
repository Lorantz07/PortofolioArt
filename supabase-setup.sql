-- =========================================================
-- GUDANG KARYA — RusianArt
-- Cara pakai: salin SELURUH isi berkas ini, buka Supabase →
-- SQL Editor → tempel → Run.
-- Aman dijalankan berulang (tiap langkah punya "jika sudah
-- ada, lewati").
-- =========================================================

-- 1) Tabel karya ------------------------------------------------------------
create table if not exists public.karya (
  id        uuid primary key default gen_random_uuid(),
  dibuat    timestamptz not null default now(),
  judul     text not null,
  kategori  text not null check (char_length(btrim(kategori)) between 1 and 40),
  media     text,
  coretan   text,
  foto      text not null,
  lebar     integer,
  tinggi    integer
);

-- 2) Aturan keamanan: semua orang boleh MELIHAT,
--    hanya yang punya akun login boleh MENULIS/MENGHAPU --------
alter table public.karya enable row level security;

drop policy if exists "karya terbaca semua orang" on public.karya;
create policy "karya terbaca semua orang"
  on public.karya for select using (true);

drop policy if exists "karya ditambah hanya yang login" on public.karya;
create policy "karya ditambah hanya yang login"
  on public.karya for insert to authenticated with check (true);

drop policy if exists "karya dihapus hanya yang login" on public.karya;
create policy "karya dihapus hanya yang login"
  on public.karya for delete to authenticated using (true);

-- 3) Map foto: karya tersimpan sebagai file di sini,
--    boleh dibaca siapa saja (alamat file panjang & tak ditebak) -------------
insert into storage.buckets (id, name, public)
values ('foto-karya', 'foto-karya', true)
on conflict (id) do nothing;

drop policy if exists "foto terbaca semua orang" on storage.objects;
create policy "foto terbaca semua orang"
  on storage.objects for select using (bucket_id = 'foto-karya');

drop policy if exists "foto diunggah hanya yang login" on storage.objects;
create policy "foto diunggah hanya yang login"
  on storage.objects for insert to authenticated with check (bucket_id = 'foto-karya');

drop policy if exists "foto dihapus hanya yang login" on storage.objects;
create policy "foto dihapus hanya yang login"
  on storage.objects for delete to authenticated using (bucket_id = 'foto-karya');
