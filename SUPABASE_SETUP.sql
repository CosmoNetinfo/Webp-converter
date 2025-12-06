-- Create the table for storing image metadata
create table public.images (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  original_name text not null,
  url text not null,
  format text not null,
  size bigint not null
);

-- Enable Row Level Security (RLS)
alter table public.images enable row level security;

-- Create policies to allow anyone (anon) to view and insert images
-- WARNING: For a production app, you should add authentication (Auth) and restrict these policies!
create policy "Allow public access to select images"
on public.images for select
to anon
using (true);

create policy "Allow public access to insert images"
on public.images for insert
to anon
with check (true);

create policy "Allow public access to delete images"
on public.images for delete
to anon
using (true);

-- STORAGE SETUP
-- You need to create a bucket named 'images' from the Storage dashboard, OR run this:
insert into storage.buckets (id, name, public) values ('images', 'images', true);

-- Storage Policies
-- Allow public access to view files in 'images' bucket
create policy "Give public access to images"
on storage.objects for select
to public
using ( bucket_id = 'images' );

-- Allow public access to upload files to 'images' bucket
create policy "Allow public uploads"
on storage.objects for insert
to public
with check ( bucket_id = 'images' );

-- Allow public access to delete files in 'images' bucket
create policy "Allow public deletes"
on storage.objects for delete
to public
using ( bucket_id = 'images' );
