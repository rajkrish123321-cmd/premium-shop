"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setProcessing(false);
      return;
    }

    const executeHandoff = async () => {
      try {
        await fetch("/api/checkout/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        setTimeout(() => setProcessing(false), 2500);
      } catch (error) {
        console.error("Handoff recording failed:", error);
        setProcessing(false);
      }
    };

    executeHandoff();
  }, [orderId]);

  if (processing) {
    return (
      <div style={{ textAlign: "center", padding: "60px", fontFamily: "sans-serif" }}>
        <div style={spinnerStyle} />
        <h2 style={{ color: "#5f259f", marginTop: "20px" }}>Verifying Transaction Route...</h2>
        <p>Returning securely from your banking app. Do not refresh this window.</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "50px", fontFamily: "sans-serif", maxWidth: "400px", margin: "0 auto" }}>
      <h2 style={{ color: "#2e7d32" }}>✨ Order Initialized Successfully</h2>
      <p>Your order assignment <strong>#{orderId}</strong> has been logged.</p>
      <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.5" }}>
        We are checking our incoming transaction ledger. Your tracking dashboard will activate as soon as the ledger updates.
      </p>
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        style={{
          marginTop: "20px",
          padding: "12px 24px",
          backgroundColor: "#5f259f",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Track My Order
      </button>
    </div>
  );
}

export default function UPIReturnHandoff() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: "center", padding: "60px", fontFamily: "sans-serif" }}>
        <h2 style={{ color: "#5f259f" }}>Preparing return status...</h2>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}

const spinnerStyle = {
  width: "50px",
  height: "50px",
  border: "5px solid #f3f3f3",
  borderTop: "5px solid #5f259f",
  borderRadius: "50%",
  margin: "0 auto",
  animation: "spin 1s linear infinite",
};
