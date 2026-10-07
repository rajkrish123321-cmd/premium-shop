import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { listRecentOrders, listUsers } from "@/lib/neon";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !session.user.role || session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin access denied" }, { status: 403 });
  }

  try {
    const [customers, orders] = await Promise.all([
      listUsers(),
      listRecentOrders(),
    ]);

    return NextResponse.json({
      customers: customers.map((customer) => ({
        id: customer.id,
        email: customer.email,
        name: customer.name,
        createdAt: customer.created_at,
        lastSignInAt: customer.last_sign_in_at,
      })),
      orders: orders.map((order) => ({
        id: String(order.id),
        userId: order.user_id,
        createdAt: String(order.created_at),
        totalAmount: Number(order.total_amount),
        status: order.status,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
      })),
    });
  } catch (error) {
    console.error("Admin customer lookup error:", error);
    return NextResponse.json({ error: "Unable to load customer details" }, { status: 500 });
  }
}
