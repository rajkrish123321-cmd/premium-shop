-- Run in the Supabase SQL editor before using authenticated order history.
alter table public.orders
add column if not exists user_id uuid references auth.users(id);

alter table public.orders enable row level security;

create policy "Customers can read their own orders"
on public.orders
for select
to authenticated
using (auth.uid() = user_id);

create index if not exists orders_user_id_created_at_idx
on public.orders (user_id, created_at desc);
