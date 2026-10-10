-- Each authenticated account owns its panels and client records.
create table if not exists public.panels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  created_at timestamptz not null default now(),
  constraint panels_user_name_unique unique (user_id, name)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 90),
  phone text not null default '',
  panel text not null,
  panel_number text not null default '',
  username text not null default '',
  password text not null default '',
  purchase_date date not null default current_date,
  expiration_date timestamp without time zone not null,
  plan text not null default '',
  app text,
  customer_status text not null default 'active' check (customer_status in ('active', 'inactive')),
  renewal_link text,
  price text,
  account_created_at timestamp without time zone,
  connections text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint clients_panel_owner_fkey
    foreign key (user_id, panel)
    references public.panels (user_id, name)
    on update cascade
    on delete restrict
);

create index if not exists clients_user_created_at_idx
  on public.clients (user_id, created_at desc);

alter table public.panels enable row level security;
alter table public.clients enable row level security;

revoke all on public.panels, public.clients from anon;
revoke all on public.panels, public.clients from authenticated;
grant select, insert, update, delete on public.panels, public.clients to authenticated;

drop policy if exists "Users can read their own panels" on public.panels;
create policy "Users can read their own panels"
  on public.panels for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own panels" on public.panels;
create policy "Users can create their own panels"
  on public.panels for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own panels" on public.panels;
create policy "Users can update their own panels"
  on public.panels for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own panels" on public.panels;
create policy "Users can delete their own panels"
  on public.panels for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own clients" on public.clients;
create policy "Users can read their own clients"
  on public.clients for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own clients" on public.clients;
create policy "Users can create their own clients"
  on public.clients for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own clients" on public.clients;
create policy "Users can update their own clients"
  on public.clients for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own clients" on public.clients;
create policy "Users can delete their own clients"
  on public.clients for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.seed_customer_manager_panels()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.panels (user_id, name)
  values
    (new.id, 'Atmos'),
    (new.id, 'Cinemax'),
    (new.id, 'Luma TV'),
    (new.id, 'Nexus'),
    (new.id, 'Espace One Play'),
    (new.id, 'Slim Plus'),
    (new.id, 'Aura TV+')
  on conflict (user_id, name) do nothing;
  return new;
end;
$$;

drop trigger if exists seed_customer_manager_panels_after_signup on auth.users;
create trigger seed_customer_manager_panels_after_signup
  after insert on auth.users
  for each row execute function public.seed_customer_manager_panels();

-- Seed defaults for accounts that already exist when this migration is applied.
insert into public.panels (user_id, name)
select users.id, defaults.name
from auth.users as users
cross join (values
  ('Atmos'),
  ('Cinemax'),
  ('Luma TV'),
  ('Nexus'),
  ('Espace One Play'),
  ('Slim Plus'),
  ('Aura TV+')
) as defaults(name)
on conflict (user_id, name) do nothing;

