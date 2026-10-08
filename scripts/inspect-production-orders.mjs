import { neon } from "@neondatabase/serverless";

export {};

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!connectionString) throw new Error("Production database URL is not configured.");

const sql = neon(connectionString);
if (process.argv.includes("--apply")) {
  const existingColumns = await sql`
    select column_name
    from information_schema.columns
    where table_schema = 'public' and table_name = 'orders'
  `;
  const columnNames = new Set(existingColumns.map(({ column_name }) => column_name));

  if (columnNames.has("razorpay_order_id")) {
    await sql`alter table public.orders alter column razorpay_order_id drop not null`;
  }
  if (columnNames.has("razorpay_payment_id")) {
    await sql`alter table public.orders alter column razorpay_payment_id drop not null`;
  }

  await sql`alter table public.orders add column if not exists payee_vpa text not null default '9507004532@ibl'`;
  await sql`alter table public.orders add column if not exists payment_status text`;
  await sql`
    update public.orders
    set payment_status = case
      when status in ('paid', 'awaiting_verification', 'failed', 'cancelled') then status
      else 'pending'
    end
    where payment_status is null
  `;
  await sql`
    alter table public.orders
      alter column payment_status set default 'pending',
      alter column payment_status set not null,
      alter column status set default 'pending',
      add column if not exists flagged_for_refund boolean not null default false
  `;
  const existingConstraint = await sql`
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_payment_status_check'
  `;
  if (!existingConstraint.length) {
    await sql`
      alter table public.orders
      add constraint orders_payment_status_check
      check (payment_status in ('pending', 'awaiting_verification', 'paid', 'failed', 'cancelled'))
    `;
  }
  await sql`create index if not exists orders_user_id_created_at_idx on public.orders (user_id, created_at desc)`;
}

const columns = await sql`
  select column_name, data_type, is_nullable, column_default
  from information_schema.columns
  where table_schema = 'public' and table_name = 'orders'
  order by ordinal_position
`;
console.log(JSON.stringify(columns, null, 2));