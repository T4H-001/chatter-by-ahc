create extension if not exists pgcrypto;

create table if not exists chat_tenant (
  id uuid primary key default gen_random_uuid(),
  tenant_key text unique not null,
  display_name text not null,
  brand_name text not null,
  brand_line text,
  primary_domain text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_library (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references chat_tenant(id) on delete cascade,
  library_key text not null,
  display_name text not null,
  category text not null,
  description text,
  is_global boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, library_key)
);

create table if not exists chat_preset (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references chat_tenant(id) on delete cascade,
  library_id uuid references chat_library(id) on delete cascade,
  preset_key text not null,
  display_name text not null,
  source_type text not null,
  description text,
  default_human_asset_keys jsonb not null default '[]'::jsonb,
  default_machine_asset_keys jsonb not null default '[]'::jsonb,
  system_read_hints jsonb not null default '[]'::jsonb,
  system_write_hints jsonb not null default '[]'::jsonb,
  authority_default text not null default 'prepare_only',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, preset_key)
);

create table if not exists chat_translation_session (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references chat_tenant(id) on delete set null,
  user_ref text,
  source_type text not null,
  input_text text not null,
  detected_domain text,
  detected_business_key text,
  authority_mode text not null,
  status text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_translation_output (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_translation_session(id) on delete cascade,
  audience text not null,
  asset_key text not null,
  title text,
  body_text text,
  structured_payload jsonb,
  output_status text not null default 'prepared',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_translation_route (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_translation_session(id) on delete cascade,
  connector_key text not null,
  action_key text not null,
  mode text not null,
  route_status text not null default 'prepared',
  route_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_drive_ingest_state (
  file_id text primary key,
  file_name text,
  last_seen_modified_time timestamptz,
  last_status text,
  last_session_id uuid,
  updated_at timestamptz not null default now()
);


create table if not exists chat_event_log (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_translation_session(id) on delete cascade,
  event_type text not null,
  event_level text not null default 'info',
  event_body jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists chat_drive_watch_channel (
  channel_id text primary key,
  resource_id text,
  resource_uri text,
  expiration_at timestamptz,
  page_token text,
  last_status text,
  updated_at timestamptz not null default now()
);
