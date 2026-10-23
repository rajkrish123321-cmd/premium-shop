"use client";

import React, { useState } from "react";

type UPICheckoutButtonProps = {
  amount: number;
  onPaymentInitiated: () => Promise<{ orderId: string; paymentUrl: string } | null>;
};

export default function UPICheckoutButton({ amount, onPaymentInitiated }: UPICheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<{ orderId: string; paymentUrl: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handlePayment = async () => {
    setErrorMessage("");
    setLoading(true);
    try {
      const request = await onPaymentInitiated();
      if (request) {
        setPaymentRequest(request);
        window.location.assign(request.paymentUrl);
      }
    } catch (error) {
      console.error("Payment initiation failed:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unable to prepare payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="phonepe-checkout">
      {!paymentRequest ? (
        <button type="button" className="upi-checkout-button" onClick={handlePayment} disabled={loading || !amount} aria-busy={loading}>
          {loading && <span className="checkout-spinner" aria-hidden="true" />}
          {loading ? "Preparing secure payment..." : `Pay securely with PhonePe · ₹${amount.toLocaleString("en-IN")}`}
        </button>
      ) : (
        <div className="upi-payment-ready" role="status">
          <p>Opening PhonePe checkout for order #{paymentRequest.orderId}.</p>
          <a className="upi-checkout-button" href={paymentRequest.paymentUrl}>Continue to PhonePe</a>
        </div>
      )}
      {errorMessage && <p className="payment-error" role="alert">{errorMessage}</p>}
    </div>
  );
}
