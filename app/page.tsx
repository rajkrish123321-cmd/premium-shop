"use client";
import React, { useState } from 'react';

export default function PremiumStoreFront() {
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [taxes, setTaxes] = useState({ cgst: 0, sgst: 0, igst: 0, grandTotal: 2499 });
  const [isCalculated, setIsCalculated] = useState(false);

  const productPrice = 2499;

  const handlePincodeBlur = async () => {
    if (pincode.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch('/api/calculate-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: productPrice, pincode })
      });
      const data = await res.json();
      setTaxes({ cgst: data.cgst, sgst: data.sgst, igst: data.igst, grandTotal: data.total });
      setIsCalculated(true);
    } catch (err) {
      console.error("Failed to parse tax metrics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fafafa', color: '#171717', fontFamily: 'sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Premium Checkout</h2>
        <p style={{ fontSize: '14px', color: '#a3a3a3', marginBottom: '24px' }}>Enter delivery details below to check legal taxes.</p>
        <div style={{ fontSize: '32px', fontWeight: '900', marginBottom: '24px' }}>₹{productPrice.toLocaleString('en-IN')}.00</div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#737373', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Indian Shipping Pincode</label>
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
            onBlur={handlePincodeBlur}
            placeholder="e.g., 827013"
            style={{ width: '93%', padding: '16px', backgroundColor: '#f5f5f5', border: '1px solid #e5e5e5', borderRadius: '12px', fontSize: '14px', outline: 'none', letterSpacing: '2px', fontWeight: 'bold' }}
          />
          {loading && <div style={{ fontSize: '12px', color: '#737373', marginTop: '4px' }}>Calculating regional GST...</div>}
        </div>

        <div style={{ backgroundColor: '#f5f5f5', borderRadius: '16px', padding: '20px', marginBottom: '24px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#737373', marginBottom: '12px' }}>
            <span>Items Subtotal</span>
            <span>₹{productPrice.toFixed(2)}</span>
          </div>

          {isCalculated && taxes.igst > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#171717', marginBottom: '12px', fontWeight: '500' }}>
              <span>Integrated GST (IGST 18%)</span>
              <span>₹{taxes.igst.toFixed(2)}</span>
            </div>
          ) : isCalculated ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#171717', marginBottom: '8px', fontWeight: '500' }}>
                <span>Central GST (CGST 9%)</span>
                <span>₹{taxes.cgst.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#171717', marginBottom: '12px', fontWeight: '500' }}>
                <span>State GST (SGST 9%)</span>
                <span>₹{taxes.sgst.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div style={{ fontSize: '12px', color: '#a3a3a3', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
              Provide a valid 6-digit pincode to parse tax split ledger
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '16px', color: '#000000', borderTop: '1px dashed #e5e5e5', paddingTop: '16px' }}>
            <span>Total Payable</span>
            <span>₹{taxes.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <button
          disabled={!isCalculated || loading}
          style={{ width: '100%', backgroundColor: isCalculated ? '#000000' : '#d4d4d4', color: '#ffffff', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: isCalculated ? 'pointer' : 'not-allowed', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          Proceed to Pay via UPI / Cards / RuPay
        </button>
      </div>
    </main>
  );
}