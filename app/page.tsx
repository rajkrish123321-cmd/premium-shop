"use client";
import React, { useState } from 'react';
import Script from 'next/script';

export default function PremiumStoreFront() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [taxes, setTaxes] = useState({ cgst: 0, sgst: 0, igst: 0, grandTotal: 2499 });
  const [isCalculated, setIsCalculated] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");

  const productPrice = 2499;
  const inputStyle = { width: '100%', padding: '14px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, marginBottom: '16px' };

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setPincode(val);
    if (val.length === 6) {
      setLoading(true);
      try {
        const res = await fetch('/api/calculate-tax', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: productPrice, pincode: val }) });
        const data = await res.json();
        setTaxes({ cgst: data.cgst, sgst: data.sgst, igst: data.igst, grandTotal: data.total });
        setIsCalculated(true);
      } catch { console.error("Failed to calculate tax lines"); }
      finally { setLoading(false); }
    } else setIsCalculated(false);
  };

  const isFormComplete = Boolean(name && email && phone.length >= 10 && address && isCalculated);
  const handlePayment = async () => {
    if (!isFormComplete) return;
    if (!(window as any).Razorpay) { alert("Payment system is still loading. Please check your internet connection."); return; }
    setPaymentStatus("Initializing secure checkout...");
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: taxes.grandTotal }) });
      const orderData = await res.json();
      if (!orderData.orderId) { alert("Backend Order error. Check server logs."); setPaymentStatus(""); return; }
      const options = {
        key: orderData.keyId, amount: orderData.amount, currency: orderData.currency, name: "PREMIUM BUSINESS STORE", description: "Premium Tech Bundle", order_id: orderData.orderId,
        handler: async (response: any) => {
          setPaymentStatus("Verifying payment security...");
          try {
            const verifyRes = await fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature }) });
            const verifyData = await verifyRes.json();
            if (!verifyData.success) { setPaymentStatus("Verification Failed."); alert("Payment verification failed! Order cancelled."); return; }
            setPaymentStatus("Payment Secured! Sending to DTDC...");
            await fetch('/api/webhooks/shipping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'order.paid', status: 'authorized', id: response.razorpay_payment_id, amount: orderData.amount, contact: phone, notes: { customer_name: name, email, shipping_address: address, landmark: landmark || "Not Provided", alternate_phone: altPhone || "Not Provided", shipping_pincode: pincode } }) });
            setPaymentStatus(`Success! Order ID: ${response.razorpay_payment_id}`); alert(`🎉 Payment Verified! AWB Tracking Generated for ${name}.`);
          } catch { setPaymentStatus("Verification Error."); alert("An error occurred during verification."); }
        }, prefill: { name, email, contact: phone }, theme: { color: "#2563eb" }
      };
      new (window as any).Razorpay(options).open();
    } catch { setPaymentStatus("Payment error occurred."); }
  };

  return <main style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', color: '#111827', fontFamily: 'sans-serif', padding: '40px 20px' }}>
    <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Checkout</h2><p style={{ color: '#6b7280', marginBottom: '24px' }}>Please enter your shipping details.</p>
      <div><input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} /><div style={{ display: 'flex', gap: '12px' }}><input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} /><input type="tel" maxLength={10} placeholder="Primary Phone" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} style={inputStyle} /></div><input type="tel" maxLength={10} placeholder="Alternate Phone (Optional)" value={altPhone} onChange={e => setAltPhone(e.target.value.replace(/\D/g, ''))} style={inputStyle} /><input type="text" placeholder="Full Street Address (House No, Building, Area)" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} /><input type="text" placeholder="Nearby Location / Landmark (Optional)" value={landmark} onChange={e => setLandmark(e.target.value)} style={inputStyle} /><input type="text" maxLength={6} placeholder="6-Digit Pincode" value={pincode} onChange={handlePincodeChange} style={inputStyle} />{loading && <small>Checking DTDC serviceability & GST...</small>}</div>
      <div style={{ backgroundColor: '#f9fafb', borderRadius: '16px', padding: '20px', margin: '24px 0' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>₹{productPrice.toFixed(2)}</span></div>{isCalculated && <div style={{ marginTop: '12px' }}>{taxes.igst > 0 ? `IGST: ₹${taxes.igst.toFixed(2)}` : `CGST: ₹${taxes.cgst.toFixed(2)} · SGST: ₹${taxes.sgst.toFixed(2)}`}</div>}<div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '18px', borderTop: '1px dashed #d1d5db', marginTop: '16px', paddingTop: '16px' }}><span>Total</span><span>₹{taxes.grandTotal.toFixed(2)}</span></div></div>
      <button onClick={handlePayment} disabled={!isFormComplete || loading} style={{ width: '100%', backgroundColor: isFormComplete ? '#2563eb' : '#e5e7eb', color: isFormComplete ? '#fff' : '#9ca3af', border: 0, padding: '16px', borderRadius: '12px', fontWeight: '800', cursor: isFormComplete ? 'pointer' : 'not-allowed' }}>{paymentStatus || (isFormComplete ? `Pay ₹${taxes.grandTotal.toFixed(2)} Securely` : "Complete Form to Pay")}</button>
    </div>
  </main>;
}