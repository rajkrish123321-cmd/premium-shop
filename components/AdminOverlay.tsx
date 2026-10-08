"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type OrderLog = {
  id: string;
  amount: number;
  payment_status: string;
  payee_vpa: string;
  flagged_for_refund: boolean;
  created_at: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  pincode: string;
};

export default function AdminOverlay() {
  const { data: session } = useSession();
  const [showAdmin, setShowAdmin] = useState(false);
  const [orders, setOrders] = useState<OrderLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session || session.user.role !== "admin") return;

    let pressCount = 0;
    let timer: number | undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.key !== "Enter") return;
      pressCount += 1;

      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        pressCount = 0;
      }, 800);

      if (pressCount === 2) {
        pressCount = 0;
        setShowAdmin((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timer) window.clearTimeout(timer);
    };
  }, [session]);

  useEffect(() => {
    if (!showAdmin || !session || session.user.role !== "admin") return;
    void fetchOrderLogs();
  }, [showAdmin, session]);

  const fetchOrderLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/customers");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not fetch order logs.");

      const mappedOrders = (data.orders || []).map((order: any) => ({
        id: String(order.id),
        amount: Number(order.totalAmount || 0),
        payment_status: order.paymentStatus || "pending",
        payee_vpa: order.payeeVpa || "9507004532@ibl",
        flagged_for_refund: Boolean(order.flaggedForRefund),
        created_at: order.createdAt || new Date().toISOString(),
        customer_name: order.customerName || "Unknown",
        customer_email: order.customerEmail || "",
        shipping_address: order.shippingAddress || "",
        pincode: order.pincode || "",
      }));

      setOrders(mappedOrders);
    } catch (error) {
      console.error("Admin log fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const response = await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, paymentStatus: newStatus }),
    });
    if (response.ok) {
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, payment_status: newStatus } : order,
        ),
      );
    }
  };

  const toggleRefundFlag = async (orderId: string, currentFlag: boolean) => {
    const response = await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, flaggedForRefund: !currentFlag }),
    });
    if (response.ok) {
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, flagged_for_refund: !currentFlag } : order,
        ),
      );
    }
  };

  if (!session || session.user.role !== "admin") return null;

  return (
    <>
      {!showAdmin && (
        <button
          type="button"
          onClick={() => setShowAdmin(true)}
          aria-label="Open admin console"
          style={floatingButtonStyle}
        >
          🔐
        </button>
      )}

      {showAdmin && (
        <div style={overlayStyle}>
          <div style={panelStyle}>
            <div style={headerStyle}>
              <h2 style={{ margin: 0 }}>🔐 TrendyJewellery Admin Console</h2>
              <button type="button" onClick={() => setShowAdmin(false)} style={closeButtonStyle}>Close</button>
            </div>

            {loading ? (
              <p style={{ textAlign: "center", padding: "24px" }}>Loading transaction ledger...</p>
            ) : (
              <div style={tableWrapStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Order</th>
                      <th style={thStyle}>Customer</th>
                      <th style={thStyle}>Amount</th>
                      <th style={thStyle}>VPA</th>
                      <th style={thStyle}>Payment status</th>
                      <th style={thStyle}>Refund flag</th>
                      <th style={thStyle}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td style={tdStyle}>#{order.id.slice(0, 8)}</td>
                        <td style={tdStyle}>
                          <div>{order.customer_name}</div>
                          <small>{order.customer_email}</small>
                        </td>
                        <td style={tdStyle}>₹{Number(order.amount).toLocaleString("en-IN")}</td>
                        <td style={tdStyle}>{order.payee_vpa}</td>
                        <td style={tdStyle}>
                          <select
                            value={order.payment_status}
                            onChange={(event) => void updateStatus(order.id, event.target.value)}
                            style={selectStyle(order.payment_status)}
                          >
                            <option value="pending">Pending</option>
                            <option value="awaiting_verification">Awaiting verification</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td style={tdStyle}>
                          <button
                            type="button"
                            onClick={() => void toggleRefundFlag(order.id, order.flagged_for_refund)}
                            style={refundButtonStyle(order.flagged_for_refund)}
                          >
                            {order.flagged_for_refund ? "Flagged" : "Safe"}
                          </button>
                        </td>
                        <td style={tdStyle}>{new Date(order.created_at).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const floatingButtonStyle: React.CSSProperties = {
  position: "fixed",
  right: 20,
  bottom: 20,
  zIndex: 90000,
  width: 54,
  height: 54,
  borderRadius: "50%",
  border: "none",
  background: "#5f259f",
  color: "#fff",
  fontSize: 24,
  cursor: "pointer",
  boxShadow: "0 12px 28px rgba(0,0,0,0.2)",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.7)",
  zIndex: 99999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const panelStyle: React.CSSProperties = {
  width: "min(1100px, 92vw)",
  maxHeight: "82vh",
  background: "#fff",
  borderRadius: 16,
  padding: 20,
  overflow: "hidden",
  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  paddingBottom: 14,
  borderBottom: "1px solid #eee",
  marginBottom: 16,
};

const closeButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 8,
  background: "#d32f2f",
  color: "#fff",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 700,
};

const tableWrapStyle: React.CSSProperties = {
  overflowY: "auto",
  maxHeight: "calc(82vh - 100px)",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: "1px solid #ddd",
  background: "#faf7ff",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 8px",
  borderBottom: "1px solid #f0f0f0",
  verticalAlign: "top",
};

const selectStyle = (status: string): React.CSSProperties => {
  const colors: Record<string, string> = {
    pending: "#fff3e0",
    awaiting_verification: "#e3f2fd",
    paid: "#e8f5e9",
    failed: "#fdecea",
    cancelled: "#f3e5f5",
  };
  return {
    background: colors[status] || "#f5f5f5",
    border: "1px solid #ddd",
    borderRadius: 6,
    padding: "6px 8px",
    fontWeight: 700,
  };
};

const refundButtonStyle = (flagged: boolean): React.CSSProperties => ({
  border: flagged ? "1px solid #c62828" : "1px solid #5f259f",
  background: flagged ? "#ffebee" : "#f5f5f5",
  color: flagged ? "#b71c1c" : "#5f259f",
  padding: "6px 10px",
  borderRadius: 6,
  fontWeight: 700,
  cursor: "pointer",
});
