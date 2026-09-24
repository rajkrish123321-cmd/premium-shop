import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "";
const sql = neon(databaseUrl);

export const neonConfigured = Boolean(databaseUrl);

function requireDatabase() {
  if (!neonConfigured) throw new Error("DATABASE_URL is not configured.");
}

export type AuthUser = { id: string; email: string; name: string; role: "customer" | "admin" };

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

export async function listUsers() {
  requireDatabase();
  return sql`
    select id::text, email, name, created_at, last_sign_in_at
    from users where role = 'customer' order by created_at desc
  ` as unknown as Promise<Array<{ id: string; email: string; name: string; created_at: string; last_sign_in_at: string | null }>>;
}

export async function getOrdersForUser(userId: string) {
  requireDatabase();
  return sql`
    select id::text, created_at, total_amount, status
    from orders where user_id = ${userId}::uuid order by created_at desc
  ` as unknown as Promise<Array<{ id: string; created_at: string; total_amount: number; status: string }>>;
}

export async function listRecentOrders() {
  requireDatabase();
  return sql`
    select id::text, user_id::text, created_at, total_amount, status, customer_name, customer_email
    from orders order by created_at desc limit 50
  ` as unknown as Promise<Array<{ id: string; user_id: string | null; created_at: string; total_amount: number; status: string; customer_name: string; customer_email: string }>>;
}

export async function insertOrder(order: {
  userId: string | null;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  pincode: string;
  cartItems: Record<string, number>;
  totalAmount: number;
}) {
  requireDatabase();
  const rows = await sql`
    insert into orders (
      user_id, razorpay_order_id, razorpay_payment_id, customer_name,
      customer_phone, customer_email, shipping_address, pincode,
      cart_items, total_amount, status
    ) values (
      ${order.userId || null}::uuid, ${order.razorpayOrderId}, ${order.razorpayPaymentId}, ${order.customerName},
      ${order.customerPhone}, ${order.customerEmail}, ${order.shippingAddress}, ${order.pincode},
      ${JSON.stringify(order.cartItems)}::jsonb, ${order.totalAmount}, 'paid'
    ) on conflict (razorpay_order_id) do nothing
    returning id::text, total_amount, status
  `;
  return rows[0] as { id: string; total_amount: number; status: string } | undefined;
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