/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

declare global {
	interface Window {
		Razorpay: new (options: Record<string, unknown>) => { open: () => void };
	}
}

const PRODUCTS = [
	{ id: 1, name: "Akruti Oxidised Damini Maangtikka", price: Math.round(428 * 1.4), image: "/item1.jpg", desc: "Stunning Navratri Oxidised Plated Masterpiece" },
	{ id: 2, name: "Etnico 18k Kundan Kamarband", price: Math.round(304 * 1.4), image: "/item2.jpg", desc: "Stone Studded Waist Belly Chain for Women" },
	{ id: 3, name: "Palak Art Austrian Stone Necklace", price: Math.round(840 * 1.4), image: "/item3.jpg", desc: "Heritage Pearl and Beads Festive Set" },
	{ id: 4, name: "Maharani Oxidised Stone Jhumki", price: Math.round(218 * 1.4), image: "/item4.jpg", desc: "Pota Stone & Pearl Drop Earrings" },
	{ id: 5, name: "Darshana Oxidised Dangler (Type A)", price: Math.round(55 * 1.4), image: "/item5.jpg", desc: "Classic Oxidised Plated Dangler Earrings" },
	{ id: 6, name: "Darshana Oxidised Dangler (Type B)", price: Math.round(37 * 1.4), image: "/item6.jpg", desc: "Lightweight Daily Wear Designer Earrings" },
];

const SUGGESTED_PRODUCT_IDS = [3, 4, 6];
const STOCK_LIMIT = 30;

export default function StorePage() {
	const router = useRouter();
	const { data: session } = useSession();
	const [cart, setCart] = useState<{ [id: number]: number }>({});
	const [phone, setPhone] = useState("");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [altPhone, setAltPhone] = useState("");
	const [address, setAddress] = useState("");
	const [landmark, setLandmark] = useState("");
	const [pincode, setPincode] = useState("");
	const [loading, setLoading] = useState(false);
	const [cartFeedback, setCartFeedback] = useState<{ id: number; message: string; key: number } | null>(null);
	const [shippingPrompt, setShippingPrompt] = useState("");
	const displayName = session?.user?.name?.trim() || session?.user?.email?.split("@")[0] || "Guest";
	const initials = displayName.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();

	const showCartFeedback = (id: number, message: string) => {
		setCartFeedback(previous => ({ id, message, key: (previous?.key || 0) + 1 }));
		window.setTimeout(() => setCartFeedback(null), 2200);
	};

	const updateQuantity = (id: number, delta: number) => setCart(prev => {
		const updated = Math.min(STOCK_LIMIT, (prev[id] || 0) + delta);
		if (updated <= 0) { const copy = { ...prev }; delete copy[id]; return copy; }
		return { ...prev, [id]: updated };
	});
	const addToCart = (id: number) => {
		const currentQuantity = cart[id] || 0;
		if (currentQuantity >= STOCK_LIMIT) {
			showCartFeedback(id, "Stock limit reached");
			return;
		}
		updateQuantity(id, 1);
		showCartFeedback(id, "Added to cart");
	};
	const buyNow = (id: number) => {
		setCart({ [id]: 1 });
		showCartFeedback(id, "Ready in your cart");
	};
	const cartItemCount = Object.values(cart).reduce((totalCount, quantity) => totalCount + quantity, 0);
	const scrollToPayment = () => {
		document.querySelector(".payment-gateway")?.scrollIntoView({ behavior: "smooth", block: "center" });
	};
	const buyCartItem = (id: number) => {
		if (!cart[id]) return;
		setCart({ [id]: cart[id] });
		scrollToPayment();
	};
	const buyFullCart = () => {
		if (!cartItemCount) {
			setShippingPrompt("Your cart is waiting for one beautiful piece before checkout.");
			return;
		}
		scrollToPayment();
	};
	const subtotal = Object.entries(cart).reduce((acc, [id, qty]) => {
		const product = PRODUCTS.find(p => p.id === Number(id));
		return acc + (product ? product.price * qty : 0);
	}, 0);
	const igst = Math.round(subtotal * 0.03);
	const total = subtotal + igst;
	const handleCheckout = async () => {
		if (!Object.keys(cart).length) return setShippingPrompt("Add a piece to your cart before checkout.");
		const missingField = !name.trim() ? "name" : !phone || phone.length < 10 ? "phone" : !address || address.length < 5 ? "address" : !/^\d{6}$/.test(pincode) ? "pincode" : "";
		if (missingField) {
			setShippingPrompt("A few required details are still needed. Let us finish your delivery details together.");
			document.querySelector(".shipping-fields")?.scrollIntoView({ behavior: "smooth", block: "center" });
			return;
		}
		setShippingPrompt("");
		setLoading(true);
		try {
			const script = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]') || document.createElement("script");
			if (!script.src) {
				script.src = "https://checkout.razorpay.com/v1/checkout.js";
				script.async = true;
				document.body.appendChild(script);
			}
			await new Promise<void>((resolve, reject) => {
				if (window.Razorpay) return resolve();
				script.onload = () => resolve();
				script.onerror = () => reject(new Error("Razorpay could not be loaded"));
			});

			const orderResponse = await fetch("/api/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ amount: total * 100 }),
			});
			const order = await orderResponse.json();
			if (!orderResponse.ok) throw new Error(order.error || "Could not create payment order");

			const razorpay = new window.Razorpay({
				key: order.keyId,
				amount: order.amount,
				currency: order.currency,
				name: "Trendy Jewellery",
				description: "Premium jewellery order",
				order_id: order.orderId,
				prefill: { name, email, contact: phone },
				theme: { color: "#b38728" },
				handler: async (payment: Record<string, string>) => {
					try {
						const verifyResponse = await fetch("/api/verify", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								razorpay_order_id: payment.razorpay_order_id,
								razorpay_payment_id: payment.razorpay_payment_id,
								razorpay_signature: payment.razorpay_signature,
							}),
						});
						if (!verifyResponse.ok) throw new Error("Payment verification failed");
						const shippingResponse = await fetch("/api/ship", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								orderId: payment.razorpay_order_id,
								paymentId: payment.razorpay_payment_id,
								signature: payment.razorpay_signature,
								name,
								email,
								phone,
								address: `${address}${landmark ? `, ${landmark}` : ""}`,
								pincode,
								cart,
								userId: session?.user?.id || null,
							}),
						});
						const shipping = await shippingResponse.json();
						if (!shippingResponse.ok) throw new Error(shipping.error || "Shipping details could not be saved");
						router.push(`/success?order_id=${shipping.order_id}`);
					} catch (error) {
						setLoading(false);
						setShippingPrompt(error instanceof Error ? error.message : "Payment completed, but order confirmation failed.");
					}
				},
			});
			setLoading(false);
			razorpay.open();
		} catch (error) {
			setLoading(false);
			setShippingPrompt(error instanceof Error ? error.message : "Unable to start payment.");
		}
	};

	return <div style={{ minHeight: "100vh", background: "#fdfbf7", color: "#111", fontFamily: "Georgia, serif", paddingBottom: 100 }}>
		<div className="trust-bar">ALL INDIA DELIVERY <span>•</span> TRUSTED AUTHENTIC BRAND <span>•</span> SECURE PAYMENTS</div>
		<header className="site-header" style={{ borderBottom: "1px solid #e6dcc3", padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
			<h1 className="brand-title" style={{ fontSize: 26, letterSpacing: 2, color: "#b38728", margin: 0 }}>TRENDY JEWELLERY</h1>
			<Link className="account-link" href={session ? "/dashboard" : "/login"}><span className="account-avatar">{session ? initials : "TJ"}</span><span><small>{session ? "Welcome back" : "Personal room"}</small><strong>{session ? displayName : "Log in / Sign up"}</strong></span></Link>
			<div className="cart-badge" aria-label={`${cartItemCount} items in cart`}><span aria-hidden="true">🛍</span> Cart <b>{cartItemCount}</b></div>
		</header>
		<section className="hero-section" style={{ textAlign: "center", padding: "60px 20px", background: "linear-gradient(135deg,#111,#2c2c2c)", color: "#fdfbf7" }}><p className="hero-kicker">EVERYDAY TREASURES, BEAUTIFULLY MADE</p><h2>Jewellery that feels like you</h2><p style={{ color: "#d4af37" }}>Discover authentic handcrafted styles, thoughtfully priced with savings up to 40%.</p></section>
		<main style={{ maxWidth: 1200, margin: "40px auto", padding: "0 20px", display: "grid", gridTemplateColumns: "2fr 1fr", gap: 40 }}>
			<div className="catalog-column"><div className="product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 24 }}>{PRODUCTS.map(product => { const quantity = cart[product.id] || 0; return <div key={product.id} className="luxury-card product-card" style={{ background: "#fff", border: "1px solid #e6dcc3", borderRadius: 12, padding: 20 }}><img src={product.image} alt={product.name} style={{ width: "100%", height: 180, objectFit: "cover" }} /><h3>{product.name}</h3><p>{product.desc}</p><strong style={{ color: "#b38728" }}>₹{product.price.toLocaleString("en-IN")}</strong><p className="stock-note">{STOCK_LIMIT - quantity} available</p><div className="product-actions"><button className="quantity-button" onClick={() => updateQuantity(product.id, -1)}>-</button> <span>{quantity}</span> <button className="quantity-button" onClick={() => addToCart(product.id)} disabled={quantity >= STOCK_LIMIT}>+</button><button className="button button-dark" onClick={() => addToCart(product.id)} disabled={quantity >= STOCK_LIMIT}>Add to cart</button><button className="button button-gold buy-button" onClick={() => buyNow(product.id)}>Buy Now ⚡</button></div>{product.id === 6 && <div className="price-alert"><span className="zigzag-line" aria-hidden="true" /><strong>Price-watch pick</strong><span>Beautiful everyday style at just ₹{product.price.toLocaleString("en-IN")}</span></div>}</div>; })}</div><section className="suggestions-section"><div className="section-heading"><div><p className="section-kicker">STYLE EDIT</p><h2>More pieces to love</h2></div><span>Curated for you</span></div><div className="suggestion-grid">{SUGGESTED_PRODUCT_IDS.map(id => { const product = PRODUCTS.find(item => item.id === id)!; return <button className="suggestion-card" key={product.id} onClick={() => addToCart(product.id)}><img src={product.image} alt="" /><span><strong>{product.name}</strong><small>₹{product.price.toLocaleString("en-IN")}</small></span><b aria-hidden="true">+</b></button>; })}</div></section></div>
			<aside className="checkout-panel" style={{ background: "#fff", border: "1px solid #e6dcc3", borderRadius: 12, padding: 30, height: "fit-content" }}><h3>Your Cart <span className="cart-panel-count">{cartItemCount} item{cartItemCount === 1 ? "" : "s"}</span></h3><div className="cart-items">{Object.entries(cart).length ? Object.entries(cart).map(([id, qty]) => { const item = PRODUCTS.find(p => p.id === Number(id))!; return <div className="cart-item" key={id}><img src={item.image} alt={item.name} /><div className="cart-item-info"><strong>{item.name}</strong><small>{item.desc}</small><span>₹{item.price.toLocaleString("en-IN")} each</span><div className="cart-item-actions"><button className="quantity-button" onClick={() => updateQuantity(item.id, -1)}>-</button><b>{qty}</b><button className="quantity-button" onClick={() => addToCart(item.id)} disabled={qty >= STOCK_LIMIT}>+</button><strong>₹{(item.price * qty).toLocaleString("en-IN")}</strong><button className="cart-buy-item" onClick={() => buyCartItem(item.id)}>Buy this item</button></div></div></div>; }) : <p className="empty-cart">Your cart is empty. Add a piece to begin.</p>}</div>{cartItemCount > 0 && <button className="buy-full-cart" onClick={buyFullCart}>Buy full cart <span>({cartItemCount} items)</span></button>}<div className="shipping-fields"><h3>Secure Checkout & Shipping</h3><input className="form-input" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required /><input className="form-input" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} /><input className="form-input" placeholder="Mobile Number" value={phone} onChange={e => setPhone(e.target.value)} required /><input className="form-input" placeholder="Alternate Mobile Number (Optional)" value={altPhone} onChange={e => setAltPhone(e.target.value)} /><textarea className="form-input address-input" placeholder="Detailed Shipping Address" value={address} onChange={e => setAddress(e.target.value)} required /><input className="form-input" placeholder="6-digit Pincode" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} required /><input className="form-input" placeholder="Nearby Landmark (Optional)" value={landmark} onChange={e => setLandmark(e.target.value)} /></div><h4>Order Summary</h4><p className="summary-line">{cartItemCount} item{cartItemCount === 1 ? "" : "s"} selected</p><hr /><p>Subtotal: ₹{subtotal.toLocaleString("en-IN")}</p><p>Estimated IGST (3%): ₹{igst.toLocaleString("en-IN")}</p><strong>Total Amount: ₹{total.toLocaleString("en-IN")}</strong><br /><div className="gemini-strip payment-gateway"><button className="checkout-button" onClick={handleCheckout} disabled={loading}>{loading ? "Opening Secure Payment..." : "Pay Securely via Razorpay"}</button></div></aside>
		</main>
		<a href="https://wa.me/919279566257" target="_blank" rel="noopener noreferrer" style={{ position: "fixed", bottom: 30, right: 30, fontSize: 30 }}>💬</a>
		{cartFeedback && <div className="cart-feedback" key={cartFeedback.key}><img src={PRODUCTS.find(product => product.id === cartFeedback.id)?.image} alt="" /><span>{cartFeedback.message}</span><b>🛍</b></div>}
		{shippingPrompt && <div className="shipping-prompt" role="alert"><strong>Almost ready</strong><span>{shippingPrompt}</span></div>}
	</div>;
}
