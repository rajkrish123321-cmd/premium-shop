import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getOrdersForUser } from "@/lib/neon";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const orders = await getOrdersForUser(session.user.id);

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: String(order.id),
        createdAt: String(order.created_at),
        totalAmount: Number(order.total_amount),
        status: order.status,
      })),
    });
  } catch (error) {
    console.error("Order history error:", error);
    return NextResponse.json({ error: "Unable to load order history" }, { status: 500 });
  }
}
