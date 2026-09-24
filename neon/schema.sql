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
  razorpay_order_id text not null unique,
  razorpay_payment_id text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null default '',
  shipping_address text not null,
  pincode text not null,
  cart_items jsonb not null,
  total_amount integer not null check (total_amount > 0),
  status text not null default 'paid',
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_created_at_idx on orders (user_id, created_at desc);