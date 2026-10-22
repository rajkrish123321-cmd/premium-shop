import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "";
const sql = neon(databaseUrl);

export const neonConfigured = Boolean(databaseUrl);

function requireDatabase() {
  if (!neonConfigured) throw new Error("DATABASE_URL is not configured.");
}

export type AuthUser = { id: string; email: string; name: string; role: "customer" | "admin" };
type CustomerRecord = { id: string; email: string; name: string; created_at: string; last_sign_in_at: string | null };
type OrderRecord = {
  id: string;
  user_id: string | null;
  created_at: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payee_vpa: string;
  flagged_for_refund: boolean;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  pincode: string;
  refunded_amount_paise: number;
  latest_refund_status: string | null;
};

export async function createUser(email: string, password: string, name: string) {
  requireDatabase();
  const passwordHash = await bcrypt.hash(password, 12);
  const rows = await sql`
    insert into users (email, password_hash, name)
    values (${email}, ${passwordHash}, ${name})
    returning id::text, email, name, role
  `;
  return rows[0] as AuthUser;
}

export async function authenticateUser(email: string, password: string) {
  requireDatabase();
  const rows = await sql`
    select id::text, email, password_hash, name, role
    from users where email = ${email} limit 1
  `;
  const user = rows[0] as { id: string; email: string; password_hash: string; name: string; role: "customer" | "admin" } | undefined;
  if (!user || !(await bcrypt.compare(password, user.password_hash))) throw new Error("Invalid credentials");
  await sql`update users set last_sign_in_at = now() where id = ${user.id}::uuid`;
  return { user: { id: user.id, email: user.email, user_metadata: { name: user.name }, role: user.role } };
}

export async function listUsers(): Promise<CustomerRecord[]> {
  requireDatabase();
  return sql`
    select id::text, email, name, created_at, last_sign_in_at
    from users where role = 'customer' order by created_at desc
  ` as unknown as Promise<CustomerRecord[]>;
}

export async function getOrdersForUser(userId: string): Promise<Array<{ id: string; created_at: string; total_amount: number; status: string }>> {
  requireDatabase();
  return sql`
    select id::text, created_at, total_amount, status
    from orders where user_id = ${userId}::uuid order by created_at desc
  ` as unknown as Promise<Array<{ id: string; created_at: string; total_amount: number; status: string }>>;
}

export async function listRecentOrders(): Promise<OrderRecord[]> {
  requireDatabase();
  return sql`
    select o.id::text, o.user_id::text, o.created_at, o.total_amount, o.status, o.payment_status,
      o.payee_vpa, o.flagged_for_refund, o.customer_name, o.customer_email, o.shipping_address, o.pincode,
      coalesce((select sum(r.amount_paise) from order_refunds r where r.order_id = o.id and r.status in ('pending', 'completed')), 0)::integer as refunded_amount_paise,
      (select r.status from order_refunds r where r.order_id = o.id order by r.created_at desc limit 1) as latest_refund_status
    from orders o order by o.created_at desc limit 50
  ` as unknown as Promise<OrderRecord[]>;
}

export async function createPendingOrder(order: {
  userId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  pincode: string;
  cartItems: Record<string, number>;
  totalAmount: number;
  payeeVpa?: string;
}) {
  requireDatabase();
  const rows = await sql`
    insert into orders (
      user_id, payee_vpa, payment_status, customer_name,
      customer_phone, customer_email, shipping_address, pincode,
      cart_items, total_amount, status
    ) values (
      ${order.userId || null}::uuid,
      ${order.payeeVpa || "9507004532@ibl"},
      'pending',
      ${order.customerName},
      ${order.customerPhone},
      ${order.customerEmail},
      ${order.shippingAddress},
      ${order.pincode},
      ${JSON.stringify(order.cartItems)}::jsonb,
      ${order.totalAmount},
      'pending'
    ) returning id::text, total_amount, payment_status, status
  `;
  return rows[0] as { id: string; total_amount: number; payment_status: string; status: string } | undefined;
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: "pending" | "awaiting_verification" | "paid" | "failed" | "cancelled",
) {
  requireDatabase();
  const normalizedStatus = paymentStatus === "paid" ? "paid" : paymentStatus === "awaiting_verification" ? "awaiting_verification" : "pending";
  const rows = await sql`
    update orders
    set payment_status = ${paymentStatus}, status = ${normalizedStatus}
    where id = ${orderId}::uuid
    returning id::text, payment_status, status
  `;
  return rows[0] as { id: string; payment_status: string; status: string } | undefined;
}

export async function confirmPaidOrder(orderId: string) {
  requireDatabase();
  const updated = await sql`
    update orders
    set payment_status = 'paid', status = 'paid'
    where id = ${orderId}::uuid and payment_status <> 'paid'
    returning id::text, customer_name, customer_phone, customer_email, shipping_address, pincode, cart_items, total_amount, created_at
  `;
  if (updated[0]) {
    return { ...(updated[0] as OrderReceipt), newlyPaid: true };
  }

  const existing = await sql`
    select id::text, customer_name, customer_phone, customer_email, shipping_address, pincode, cart_items, total_amount, created_at
    from orders where id = ${orderId}::uuid and payment_status = 'paid'
  `;
  return existing[0] ? { ...(existing[0] as OrderReceipt), newlyPaid: false } : null;
}

export async function getOrderPayment(orderId: string) {
  requireDatabase();
  const rows = await sql`
    select id::text, payment_status, total_amount
    from orders where id = ${orderId}::uuid limit 1
  `;
  return rows[0] as { id: string; payment_status: string; total_amount: number } | undefined;
}

type OrderReceipt = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address: string;
  pincode: string;
  cart_items: Record<string, number>;
  total_amount: number;
  created_at: string;
};

export async function updateOrderRefundFlag(orderId: string, flaggedForRefund: boolean) {
  requireDatabase();
  const rows = await sql`
    update orders
    set flagged_for_refund = ${flaggedForRefund}
    where id = ${orderId}::uuid
    returning id::text, flagged_for_refund
  `;
  return rows[0] as { id: string; flagged_for_refund: boolean } | undefined;
}

export async function updateOrderAdminState(
  orderId: string,
  updates: { paymentStatus?: "pending" | "awaiting_verification" | "paid" | "failed" | "cancelled"; flaggedForRefund?: boolean },
) {
  requireDatabase();
  const nextPaymentStatus = updates.paymentStatus ?? null;
  const nextFlagged = updates.flaggedForRefund ?? null;

  const rows = await sql`
    update orders
    set
      payment_status = coalesce(${nextPaymentStatus}, payment_status),
      status = case
        when ${nextPaymentStatus} is null then status
        when ${nextPaymentStatus} = 'paid' then 'paid'
        when ${nextPaymentStatus} = 'awaiting_verification' then 'awaiting_verification'
        else 'pending'
      end,
      flagged_for_refund = coalesce(${nextFlagged}, flagged_for_refund)
    where id = ${orderId}::uuid
    returning id::text, payment_status, status, flagged_for_refund
  `;

  return rows[0] as { id: string; payment_status: string; status: string; flagged_for_refund: boolean } | undefined;
}

export async function createPasswordResetToken(email: string, tokenHash: string, expiresAt: Date) {
  requireDatabase();
  const rows = await sql`select id::text from users where email = ${email} limit 1`;
  if (!rows[0]) return false;
  await sql`update users set reset_token_hash = ${tokenHash}, reset_token_expires_at = ${expiresAt.toISOString()} where email = ${email}`;
  return true;
}

export async function updatePassword(tokenHash: string, password: string) {
  requireDatabase();
  const passwordHash = await bcrypt.hash(password, 12);
  const rows = await sql`
    update users set password_hash = ${passwordHash}, reset_token_hash = null, reset_token_expires_at = null
    where reset_token_hash = ${tokenHash} and reset_token_expires_at > now() returning id
  `;
  if (!rows[0]) throw new Error("Invalid or expired reset token");
}

export async function createPendingRefund(orderId: string, merchantRefundId: string, amountPaise: number) {
  requireDatabase();
  const rows = await sql`
    with reserved_order as (
      update orders
      set refund_reserved_amount_paise = refund_reserved_amount_paise + ${amountPaise}
      where id = ${orderId}::uuid
        and payment_status = 'paid'
        and refund_reserved_amount_paise + ${amountPaise} <= total_amount * 100
      returning id
    )
    insert into order_refunds (merchant_refund_id, order_id, amount_paise, status)
    select ${merchantRefundId}, reserved_order.id, ${amountPaise}, 'pending'
    from reserved_order
    returning merchant_refund_id, order_id::text, amount_paise, status
  `;
  return rows[0] as { merchant_refund_id: string; order_id: string; amount_paise: number; status: string } | undefined;
}

export async function updateRefundState(
  merchantRefundId: string,
  state: "pending" | "completed" | "failed",
  refundId?: string,
) {
  requireDatabase();
  if (state === "failed") {
    const rows = await sql`
      with changed as (
        update order_refunds
        set status = 'failed', phonepe_refund_id = coalesce(${refundId || null}, phonepe_refund_id), updated_at = now()
        where merchant_refund_id = ${merchantRefundId} and status = 'pending'
        returning merchant_refund_id, order_id, amount_paise, status
      ), released as (
        update orders o
        set refund_reserved_amount_paise = greatest(0, o.refund_reserved_amount_paise - changed.amount_paise)
        from changed where o.id = changed.order_id
      )
      select merchant_refund_id, order_id::text, amount_paise, status from changed
    `;
    return rows[0] as { merchant_refund_id: string; order_id: string; amount_paise: number; status: string } | undefined;
  }
  const rows = await sql`
    update order_refunds
    set status = ${state}, phonepe_refund_id = coalesce(${refundId || null}, phonepe_refund_id), updated_at = now()
    where merchant_refund_id = ${merchantRefundId}
      and status = 'pending'
    returning merchant_refund_id, order_id::text, amount_paise, status
  `;
  return rows[0] as { merchant_refund_id: string; order_id: string; amount_paise: number; status: string } | undefined;
}

export async function claimRefundEmail(merchantRefundId: string) {
  requireDatabase();
  const rows = await sql`
    update order_refunds r
    set email_state = 'sending', updated_at = now()
    where r.merchant_refund_id = ${merchantRefundId}
      and r.status = 'completed'
      and r.email_state in ('pending', 'failed')
    returning r.merchant_refund_id, r.order_id::text, r.amount_paise,
      (select o.customer_email from orders o where o.id = r.order_id) as customer_email,
      (select o.customer_name from orders o where o.id = r.order_id) as customer_name
  `;
  return rows[0] as { merchant_refund_id: string; order_id: string; amount_paise: number; customer_email: string; customer_name: string } | undefined;
}

export async function finishRefundEmail(merchantRefundId: string, sent: boolean) {
  requireDatabase();
  await sql`
    update order_refunds set email_state = ${sent ? "sent" : "failed"}, updated_at = now()
    where merchant_refund_id = ${merchantRefundId} and email_state = 'sending'
  `;
}

export async function getRefund(orderId: string) {
  requireDatabase();
  const rows = await sql`
    select coalesce(sum(amount_paise) filter (where status in ('pending', 'completed')), 0)::integer as refunded_amount_paise,
      (array_agg(status order by created_at desc))[1] as latest_refund_status
    from order_refunds where order_id = ${orderId}::uuid
  `;
  return rows[0] as { refunded_amount_paise: number; latest_refund_status: string | null } | undefined;
}

export async function getRefundByMerchantId(merchantRefundId: string) {
  requireDatabase();
  const rows = await sql`
    select merchant_refund_id, order_id::text, amount_paise, status
    from order_refunds where merchant_refund_id = ${merchantRefundId} limit 1
  `;
  return rows[0] as { merchant_refund_id: string; order_id: string; amount_paise: number; status: string } | undefined;
}