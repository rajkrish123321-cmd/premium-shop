"use client";

import React, { useState } from "react";

type UPICheckoutButtonProps = {
  amount: number;
  onPaymentInitiated: () => Promise<{ orderId: string; upiUrl: string } | null>;
};

export default function UPICheckoutButton({ amount, onPaymentInitiated }: UPICheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<{ orderId: string; upiUrl: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handlePayment = async () => {
    setErrorMessage("");
    setLoading(true);
    const isMobileDevice = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    const paymentWindow = isMobileDevice ? window.open("about:blank", "_blank") : null;

    try {
      const request = await onPaymentInitiated();
      if (request) {
        setPaymentRequest(request);
        if (paymentWindow) paymentWindow.location.href = request.upiUrl;
      } else {
        paymentWindow?.close();
      }
    } catch (error) {
      paymentWindow?.close();
      console.error("Payment initiation failed:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unable to prepare payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upi-checkout">
      {!paymentRequest ? (
        <button type="button" className="upi-checkout-button" onClick={handlePayment} disabled={loading || !amount}>
          {loading ? "Preparing secure payment..." : `Continue to UPI payment · ₹${amount.toLocaleString("en-IN")}`}
        </button>
      ) : (
        <div className="upi-payment-ready" role="status">
          <p>Order #{paymentRequest.orderId} is ready. If your UPI app did not open, choose an app below.</p>
          <a className="upi-checkout-button" href={paymentRequest.upiUrl}>Choose UPI app</a>
        </div>
      )}
      {errorMessage && <p className="payment-error" role="alert">{errorMessage}</p>}
    </div>
  );
}
