create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  reset_token_hash text,
  reset_token_expires_at timestamptz,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  payee_vpa text not null default '9507004532@ibl',
  payment_status text not null default 'pending' check (payment_status in ('pending', 'awaiting_verification', 'paid', 'failed', 'cancelled')),
  flagged_for_refund boolean not null default false,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null default '',
  shipping_address text not null,
  pincode text not null,
  cart_items jsonb not null,
  total_amount integer not null check (total_amount > 0),
  status text not null default 'pending' check (status in ('pending', 'awaiting_verification', 'paid', 'failed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table orders add column if not exists flagged_for_refund boolean not null default false;

create index if not exists orders_user_id_created_at_idx on orders (user_id, created_at desc);