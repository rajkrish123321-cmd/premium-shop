alter table orders
  add column if not exists refund_reserved_amount_paise integer not null default 0
  check (refund_reserved_amount_paise >= 0);

create table if not exists order_refunds (
  merchant_refund_id text primary key,
  phonepe_refund_id text,
  order_id uuid not null references orders(id) on delete cascade,
  amount_paise integer not null check (amount_paise >= 100),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  email_state text not null default 'pending' check (email_state in ('pending', 'sending', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_refunds_order_id_created_at_idx on order_refunds (order_id, created_at desc);