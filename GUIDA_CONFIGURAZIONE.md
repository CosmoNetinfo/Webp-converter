# ☁️ Guida Configurazione Cloud (Supabase)

Questa guida ti spiega come configurare il tuo spazio Cloud personale (gratuito) per salvare le immagini convertite con **Cosmo Converter**.

## Passo 1: Crea un Account Supabase
1. Vai su [supabase.com](https://supabase.com).
2. Clicca su **"Start your project"**.
3. Accedi con GitHub o email.
4. Clicca su **"New Project"**.
5. Dai un nome al progetto (es. `CosmoGallery`), inserisci una password sicura per il database e scegli una regione vicina a tv (es. `Frankfurt` o `London`).
6. Clicca su **"Create new project"** e attendi qualche minuto che sia pronto.

## Passo 2: Configura il Database
Una volta che il progetto è pronto:
1. Nella barra laterale sinistra, cerca l'icona **SQL Editor** (ha due parentesi quadre `[ ]`).
2. Clicca su **"New Query"** (o incolla nell'editor vuoto).
3. Copia e incolla **tutto** il seguente codice SQL:

```sql
-- 1. Crea la tabella per le immagini
create table public.images (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  original_name text not null,
  url text not null,
  format text not null,
  size bigint not null
);

-- 2. Abilita la sicurezza (Row Level Security)
alter table public.images enable row level security;

-- 3. Crea politiche di accesso (Pubblico per demo/uso personale)
create policy "Allow public access to select images" on public.images for select to anon using (true);
create policy "Allow public access to insert images" on public.images for insert to anon with check (true);
create policy "Allow public access to delete images" on public.images for delete to anon using (true);

-- 4. Crea il "Bucket" per i file (chiamato 'images')
insert into storage.buckets (id, name, public) values ('images', 'images', true);

-- 5. Abilita accesso allo Storage
create policy "Give public access to images" on storage.objects for select to public using ( bucket_id = 'images' );
create policy "Allow public uploads" on storage.objects for insert to public with check ( bucket_id = 'images' );
create policy "Allow public deletes" on storage.objects for delete to public using ( bucket_id = 'images' );
```

4. Clicca sul pulsante verde **"Run"** in basso a destra.
   * *Se vedi scritto "Success", il database è pronto!*

## Passo 3: Ottieni le Chiavi API
1. Nella barra laterale sinistra, clicca sull'icona **Settings** (Ingranaggio) in basso.
2. Clicca su **"API"**.
3. Troverai due valori importanti:
   * **Project URL**: (es. `https://xyz...supabase.co`)
   * **Project API keys** -> **anon** / **public**: (una stringa lunga che inizia spesso con `eyJ...`)

## Passo 4: Collega Cosmo Converter
1. Apri **Cosmo Converter** (Web o App Windows).
2. Vai nella scheda **"Settings"** (Impostazioni).
3. Copia il **Project URL** da Supabase e incollalo nel campo "Supabase Project URL" dell'app.
4. Copia la **API Key (anon)** da Supabase e incollala nel campo "Supabase Anon Key" dell'app.
5. Clicca **"Save Configuration"**.

🎉 **Fatto!** Ora puoi convertire le immagini e cliccare su "Save to Cloud" per salvarle nel tuo spazio personale.
