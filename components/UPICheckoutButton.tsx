"use client";

import React, { useState } from "react";

type UPICheckoutButtonProps = {
  amount: number;
  orderDetails?: Record<string, unknown>;
  onPaymentInitiated: () => Promise<string | null>;
};

export default function UPICheckoutButton({ amount, onPaymentInitiated }: UPICheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const orderId = await onPaymentInitiated();
      if (!orderId) {
        alert("Failed to initialize order. Please try again.");
        setLoading(false);
        return;
      }

      const payeeVPA = "9507004532@ibl";
      const brandName = encodeURIComponent("TrendyJewellery");
      const transactionNote = encodeURIComponent(`Store Order #${orderId}`);
      const upiUrl = `upi://pay?pa=${payeeVPA}&pn=${brandName}&tn=${transactionNote}&am=${amount}&cu=INR`;

      window.location.href = upiUrl;
    } catch (error) {
      console.error("Payment initiation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={loading || !amount}
      style={{
        width: "100%",
        padding: "14px",
        backgroundColor: "#5f259f",
        color: "#ffffff",
        fontSize: "16px",
        fontWeight: 700,
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}
    >
      {loading ? "Opening UPI Apps..." : `Pay ₹${amount} via PhonePe / UPI`}
    </button>
  );
}
