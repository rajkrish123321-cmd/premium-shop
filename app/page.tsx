"use client";
import React, { useState, useEffect } from 'react';
import Script from 'next/script';

// --- YOUR DATABASE (PRICES INCREASED BY 40%) ---
const PRODUCTS = [
  { 
    id: 'prod_1', 
    name: 'Akruti Collection Oxidised Navratri Damini Maangtikka', 
    price: 599, 
    stock: 20,
    images: ['/item1.jpg', '/item1-alt.jpg'], 
    desc: 'Stunning Oxidised Plated Finish.' 
  },
  { 
    id: 'prod_2', 
    name: 'Etnico 18k Gold Plated Kundan Kamarband/Waist Chain', 
    price: 426, 
    stock: 20,
    images: ['/item2.jpg', '/item2-alt.jpg'], 
    desc: 'White Stone Studded Belly Chain for Women (B003W).' 
  },
  { 
    id: 'prod_3', 
    name: 'Palak Art Heritage Austrian Stone Pearl Necklace Set', 
    price: 1176, 
    stock: 20,
    images: ['/item3.jpg', '/item3-alt.jpg'], 
    desc: 'White Pearl and Beads with Austrian Stone.' 
  },
  { 
    id: 'prod_4', 
    name: 'Maharani Jewels Oxidised Pota Stone Pearl Jhumki', 
    price: 305, 
    stock: 20,
    images: ['/item4.jpg', '/item4-alt.jpg'], 
    desc: 'Black Pearl Jhumki Earrings.' 
  },
  { 
    id: 'prod_5', 
    name: 'Darshana Jewels Oxidised Plated Dangler Earrings (Large)', 
    price: 77, 
    stock: 20,
    images: ['/item5.jpg', '/item5-alt.jpg'], 
    desc: 'Oxidised Dangler Earrings.' 
  },
  { 
    id: 'prod_6', 
    name: 'Darshana Jewels Oxidised Plated Dangler Earrings (Small)', 
    price: 52, 
    stock: 20,
    images: ['/item6.jpg', '/item6-alt.jpg'], 
    desc: 'Oxidised Dangler Earrings.' 
  }
];

export default function TrendyJewelleryStore() {
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // --- CHECKOUT STATE ---
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [taxes, setTaxes] = useState({ cgst: 0, sgst: 0, igst: 0, grandTotal: 0 });
  const [isCalculated, setIsCalculated] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");

  const SUPPORT_NUMBER = "919279566257"; // Updated WhatsApp Number
  const WHATSAPP_LINK = `https://wa.me/${SUPPORT_NUMBER}?text=Hi%20Trendy%20Jewellery!%20I%20need%20help%20with%20an%20order.`;

  // --- AUTOMATED IMAGE ANIMATION LOGIC ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % 2); 
    }, 3000); 
    return () => clearInterval(timer);
  }, []);

  const cartTotal = Object.keys(cart).reduce((total, id) => {
    const product = PRODUCTS.find(p => p.id === id);
    return total + (product ? product.price * cart[id] : 0);
  }, 0);

  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  // --- LIVE TAX RE-CALCULATOR FOR CART EDITING ---
  // If they change quantities during checkout, automatically recalculate GST!
  useEffect(() => {
    if (isCheckingOut && pincode.length === 6 && cartTotal > 0) {
      const fetchTax = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/calculate-tax', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: cartTotal, pincode: pincode })
          });
          const data = await res.json();
          setTaxes({ cgst: data.cgst, sgst: data.sgst, igst: data.igst, grandTotal: data.total });
          setIsCalculated(true);
        } catch (err) {
          setIsCalculated(false);
        } finally {
          setLoading(false);
        }
      };
      fetchTax();
    } else if (cartTotal === 0 && isCheckingOut) {
      setIsCheckingOut(false); // If they delete everything, send them back to the shop
    }
  }, [cartTotal]); 

  // --- STOCK LIMIT LOGIC ---
  const updateQuantity = (id: string, delta: number) => {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return;

    setCart(prev => {
      const current = prev[id] || 0;
      const next = current + delta;
      
      if (next > product.stock) {
        alert(`Sorry, we only have ${product.stock} of ${product.name} left in stock!`);
        return prev;
      }
      
      if (next <= 0) {
        const newCart = { ...prev };
        delete newCart[id];
        return newCart;
      }
      return { ...prev, [id]: next };
    });
  };

  const handleBuyNow = (id: string) => {
    if (!cart[id]) updateQuantity(id, 1);
    setIsCheckingOut(true);
  };

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setPincode(val);
    if (val.length === 6 && cartTotal > 0) {
      setLoading(true);
      try {
        const res = await fetch('/api/calculate-tax', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: cartTotal, pincode: val })
        });
        const data = await res.json();
        setTaxes({ cgst: data.cgst, sgst: data.sgst, igst: data.igst, grandTotal: data.total });
        setIsCalculated(true);
      } catch (err) {
        console.error("Failed to calculate tax lines");
      } finally {
        setLoading(false);
      }
    } else {
      setIsCalculated(false);
    }
  };

  const isFormComplete = name && email && phone.length >= 10 && address && isCalculated;

  const handlePayment = async () => {
    if (!isFormComplete) return;
    if (!(window as any).Razorpay) return alert("Payment system loading. Please wait.");
    
    setPaymentStatus("Initializing secure checkout...");
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: taxes.grandTotal })
      });
      const orderData = await res.json();
      
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "TRENDY JEWELLERY",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          setPaymentStatus("Verifying payment security...");
          try {
            const verifyRes = await fetch("/api/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setPaymentStatus("Payment Secured! Processing order...");
              await fetch('/api/webhooks/shipping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: 'order.paid',
                  id: response.razorpay_payment_id,
                  amount: orderData.amount,
                  contact: phone,
                  notes: { customer_name: name, email, shipping_address: address, landmark: landmark || "None", alternate_phone: altPhone || "None", shipping_pincode: pincode }
                })
              });
              alert(`🎉 Payment Verified! Order ID: ${response.razorpay_payment_id}`);
              setCart({}); 
              setIsCheckingOut(false); 
            }
          } catch (error) {
            setPaymentStatus("Error.");
          }
        },
        prefill: { name, email, contact: phone },
        theme: { color: "#d4af37" } 
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      setPaymentStatus("Payment error.");
    }
  };

  const inputStyle = { width: '100%', padding: '14px', backgroundColor: '#fafafa', border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '14px', outline: 'none', marginBottom: '16px' };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#fff', color: '#111', fontFamily: 'sans-serif' }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* --- HEADER --- */}
      <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eaeaea', position: 'sticky', top: 0, backgroundColor: 'rgba(255,255,255,0.95)', zIndex: 50, backdropFilter: 'blur(10px)' }}>
        <h1 onClick={() => setIsCheckingOut(false)} style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '2px', cursor: 'pointer', margin: 0, color: '#d4af37' }}>
          TRENDY JEWELLERY
        </h1>
        <div onClick={() => cartTotal > 0 && setIsCheckingOut(true)} style={{ cursor: cartTotal > 0 ? 'pointer' : 'default', fontWeight: 'bold' }}>
          🛒 Cart ({cartItemCount}) - ₹{cartTotal.toLocaleString('en-IN')}
        </div>
      </header>

      {/* --- WHATSAPP BUTTON --- */}
      <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" style={{ position: 'fixed', bottom: '30px', right: '30px', backgroundColor: '#25D366', color: '#fff', padding: '16px 20px', borderRadius: '50px', textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px' }}>
        💬 Chat on WhatsApp
      </a>

      <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        {!isCheckingOut ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 style={{ fontSize: '36px', fontWeight: '300', marginBottom: '16px' }}>Elegance, Redefined.</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
              {PRODUCTS.map(product => (
                <div key={product.id} style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
                  
                  {/* --- AUTOMATED IMAGE ANIMATION CONTAINER --- */}
                  <div style={{ height: '300px', overflow: 'hidden', position: 'relative', backgroundColor: '#f9f9f9' }}>
                    <img 
                      src={product.images[currentImageIndex % product.images.length] || product.images[0]} 
                      alt={product.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.8s ease-in-out' }} 
                    />
                  </div>
                  
                  <div style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', lineHeight: '1.4' }}>{product.name}</h3>
                    <p style={{ fontSize: '14px', color: '#777', marginBottom: '16px', minHeight: '40px' }}>{product.desc}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#d4af37' }}>₹{product.price.toLocaleString('en-IN')}</div>
                    </div>
                    
                    {/* --- FLOATING PILL UI FOR CART --- */}
                    {cart[product.id] ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', color: '#fff', borderRadius: '50px', padding: '8px 16px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
                        <button onClick={() => updateQuantity(product.id, -1)} style={{ background: 'none', color: '#fff', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '0 10px', fontWeight: 'bold' }}>-</button>
                        <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{cart[product.id]} in cart</span>
                        <button onClick={() => updateQuantity(product.id, 1)} style={{ background: 'none', color: '#fff', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '0 10px', fontWeight: 'bold' }}>+</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => updateQuantity(product.id, 1)} style={{ flex: 1, padding: '14px', border: '1px solid #111', background: '#fff', color: '#111', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}>Add to Cart</button>
                        <button onClick={() => handleBuyNow(product.id)} style={{ flex: 1, padding: '14px', border: 'none', background: '#111', color: '#fff', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>Buy Now</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {cartTotal > 0 && (
              <div style={{ textAlign: 'center', marginTop: '60px' }}>
                <button onClick={() => setIsCheckingOut(true)} style={{ padding: '20px 60px', backgroundColor: '#d4af37', color: '#fff', border: 'none', borderRadius: '50px', fontSize: '18px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 25px rgba(212, 175, 55, 0.4)' }}>
                  Proceed to Checkout (₹{cartTotal.toLocaleString('en-IN')})
                </button>
              </div>
            )}
          </>
        ) : (
          
          /* --- CHECKOUT VIEW --- */
          <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' }}>
            <button onClick={() => setIsCheckingOut(false)} style={{ background: 'none', border: 'none', color: '#d4af37', cursor: 'pointer', fontWeight: 'bold', marginBottom: '24px', padding: 0 }}>← Back to Shop</button>
            <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '24px' }}>Secure Checkout</h2>

            {/* --- IN-CHECKOUT CART EDITOR (THE "LURE") --- */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#555' }}>Your Cart Items</h3>
              {Object.keys(cart).map(id => {
                const product = PRODUCTS.find(p => p.id === id);
                if (!product) return null;
                return (
                  <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px', marginBottom: '12px' }}>
                    <div style={{ flex: 1, paddingRight: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.2' }}>{product.name}</div>
                      <div style={{ fontSize: '14px', color: '#d4af37', fontWeight: '900', marginTop: '4px' }}>₹{product.price.toLocaleString('en-IN')}</div>
                    </div>
                    {/* Mini Floating Quantity Adjuster */}
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: '50px', border: '1px solid #ddd' }}>
                      <button onClick={() => updateQuantity(product.id, -1)} style={{ background: 'none', border: 'none', padding: '6px 12px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{cart[id]}</span>
                      <button onClick={() => updateQuantity(product.id, 1)} style={{ background: 'none', border: 'none', padding: '6px 12px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                    </div>
                  </div>
                );
              })}
              {/* Lure to add more items */}
              <button onClick={() => setIsCheckingOut(false)} style={{ width: '100%', padding: '12px', marginTop: '8px', background: 'none', border: '1px dashed #ccc', borderRadius: '8px', cursor: 'pointer', color: '#777', fontWeight: 'bold' }}>
                + Add More Items to Cart
              </button>
            </div>
            
            <div style={{ marginBottom: '32px' }}>
              <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
              <div style={{ display: 'flex', gap: '16px' }}>
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                <input type="tel" maxLength={10} placeholder="Primary Phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} style={inputStyle} />
              </div>
              <input type="tel" maxLength={10} placeholder="Alternate Phone (Optional)" value={altPhone} onChange={(e) => setAltPhone(e.target.value.replace(/\D/g, ''))} style={inputStyle} />
              <input type="text" placeholder="Full Street Address" value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
              <input type="text" placeholder="Nearby Location / Landmark (Optional)" value={landmark} onChange={(e) => setLandmark(e.target.value)} style={inputStyle} />
              <input type="text" maxLength={6} value={pincode} onChange={handlePincodeChange} placeholder="6-Digit Pincode to Calculate Taxes" style={{...inputStyle, fontWeight: 'bold', borderColor: '#d4af37', borderWidth: '2px'}} />
              {loading && <div style={{ fontSize: '13px', color: '#d4af37', fontWeight: 'bold' }}>Calculating Live GST based on Pincode...</div>}
            </div>

            <div style={{ backgroundColor: '#fafafa', borderRadius: '12px', padding: '24px', marginBottom: '32px', border: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', marginBottom: '12px' }}><span>Cart Subtotal</span><span>₹{cartTotal.toLocaleString('en-IN')}</span></div>
              
              {isCalculated && taxes.igst > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#333', marginBottom: '12px' }}><span>IGST (3%) Jewellery Tax</span><span>₹{taxes.igst.toFixed(2)}</span></div>
              ) : isCalculated ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#333', marginBottom: '8px' }}><span>CGST (1.5%)</span><span>₹{taxes.cgst.toFixed(2)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#333', marginBottom: '12px' }}><span>SGST (1.5%)</span><span>₹{taxes.sgst.toFixed(2)}</span></div>
                </>
              ) : (
                <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>Taxes applied upon pincode entry</div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '20px', color: '#111', borderTop: '2px solid #eaeaea', paddingTop: '16px', marginTop: '16px' }}><span>Grand Total</span><span>₹{taxes.grandTotal.toFixed(2)}</span></div>
            </div>

            <button onClick={handlePayment} disabled={!isFormComplete || loading} style={{ width: '100%', backgroundColor: isFormComplete ? '#111' : '#ccc', color: '#fff', border: 'none', padding: '20px', borderRadius: '12px', fontSize: '16px', fontWeight: '900', cursor: isFormComplete ? 'pointer' : 'not-allowed' }}>
              {paymentStatus || (isFormComplete ? `Pay ₹${taxes.grandTotal.toFixed(2)} Securely` : "Complete Address to Pay")}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

