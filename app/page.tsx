/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import UPICheckoutButton from "@/components/UPICheckoutButton";

const PRODUCTS = [
	{ id: 1, name: "Akruti Oxidised Damini Maangtikka", price: Math.round(428 * 1.4), image: "/item1.jpg", editorialImage: "/item1-alt.jpg", desc: "Stunning Navratri Oxidised Plated Masterpiece" },
	{ id: 2, name: "Etnico 18k Kundan Kamarband", price: Math.round(304 * 1.4), image: "/item2.jpg", editorialImage: "/item2-alt.jpg", desc: "Stone Studded Waist Belly Chain for Women" },
	{ id: 3, name: "Palak Art Austrian Stone Necklace", price: Math.round(840 * 1.4), image: "/item3.jpg", editorialImage: "/item3-alt.jpg", desc: "Heritage Pearl and Beads Festive Set" },
	{ id: 4, name: "Maharani Oxidised Stone Jhumki", price: Math.round(218 * 1.4), image: "/item4.jpg", editorialImage: "/item4-alt.jpg", desc: "Pota Stone & Pearl Drop Earrings" },
	{ id: 5, name: "Darshana Oxidised Dangler (Type A)", price: Math.round(55 * 1.4), image: "/item5.jpg", editorialImage: "/item5-alt.jpg", desc: "Classic Oxidised Plated Dangler Earrings" },
	{ id: 6, name: "Darshana Oxidised Dangler (Type B)", price: Math.round(37 * 1.4), image: "/item6.jpg", editorialImage: "/item6-alt.jpg", desc: "Lightweight Daily Wear Designer Earrings" },
];

const SUGGESTED_PRODUCT_IDS = [3, 4, 6];
const STOCK_LIMIT = 30;
const CART_STORAGE_KEY = "trendy-jewellery-cart-v1";

const readStoredCart = () => {
	if (typeof window === "undefined") return {} as { [id: number]: number };
	try {
		const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
		if (!savedCart) return {} as { [id: number]: number };
		const parsed = JSON.parse(savedCart) as Record<string, number>;
		return Object.fromEntries(
			Object.entries(parsed)
				.filter(([key, value]) => Number.isFinite(Number(key)) && Number.isFinite(Number(value)) && Number(value) > 0)
				.map(([key, value]) => [Number(key), Math.min(STOCK_LIMIT, Number(value))]),
		) as { [id: number]: number };
	} catch {
		return {} as { [id: number]: number };
	}
};

const cartSubscribers = new Set<() => void>();
const subscribeToCart = (listener: () => void) => {
	cartSubscribers.add(listener);
	window.addEventListener("storage", listener);
	return () => {
		cartSubscribers.delete(listener);
		window.removeEventListener("storage", listener);
	};
};
const getCartSnapshot = () => JSON.stringify(readStoredCart());
const getServerCartSnapshot = () => "{}";

function ProductImage({ src, alt }: { src: string; alt: string }) {
	const [isZoomed, setIsZoomed] = useState(false);
	const moveZoom = (event: React.PointerEvent<HTMLButtonElement>) => {
		const bounds = event.currentTarget.getBoundingClientRect();
		const x = ((event.clientX - bounds.left) / bounds.width) * 100;
		const y = ((event.clientY - bounds.top) / bounds.height) * 100;
		event.currentTarget.style.setProperty("--zoom-x", `${x}%`);
		event.currentTarget.style.setProperty("--zoom-y", `${y}%`);
	};

	return <button
		className={`product-visual${isZoomed ? " is-zoomed" : ""}`}
		type="button"
		aria-label={`${isZoomed ? "Zoom out from" : "Zoom in on"} ${alt}`}
		aria-pressed={isZoomed}
		onPointerMove={moveZoom}
		onPointerLeave={event => {
			if (event.pointerType === "mouse") setIsZoomed(false);
		}}
		onClick={() => setIsZoomed(value => !value)}
	>
		<img src={src} alt={alt} />
		<span className="product-zoom-hint" aria-hidden="true">{isZoomed ? "Tap to close" : "View detail"}</span>
	</button>;
}

export default function StorePage() {
	const { data: session } = useSession();
	const cartSnapshot = useSyncExternalStore(subscribeToCart, getCartSnapshot, getServerCartSnapshot);
	const cart = JSON.parse(cartSnapshot) as { [id: number]: number };
	const setCart: React.Dispatch<React.SetStateAction<{ [id: number]: number }>> = update => {
		const currentCart = readStoredCart();
		const nextCart = typeof update === "function" ? update(currentCart) : update;
		window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart));
		cartSubscribers.forEach(listener => listener());
	};
	const [phone, setPhone] = useState("");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [altPhone, setAltPhone] = useState("");
	const [address, setAddress] = useState("");
	const [landmark, setLandmark] = useState("");
	const [pincode, setPincode] = useState("");
	const [cartFeedback, setCartFeedback] = useState<{ id: number; message: string; key: number } | null>(null);
	const [shippingPrompt, setShippingPrompt] = useState("");
	const promptTimer = useRef<number | null>(null);
	const feedbackTimer = useRef<number | null>(null);
	const displayName = session?.user?.name?.trim() || session?.user?.email?.split("@")[0] || "Guest";
	const initials = displayName.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();

	useEffect(() => {
		const revealObserver = new IntersectionObserver(entries => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					entry.target.classList.add("is-visible");
					revealObserver.unobserve(entry.target);
				}
			});
		}, { threshold: 0.12, rootMargin: "0px 0px -36px 0px" });
		document.querySelectorAll("[data-reveal]").forEach(element => revealObserver.observe(element));
		return () => revealObserver.disconnect();
	}, []);

	const showPrompt = (message: string) => {
		setShippingPrompt(message);
		if (promptTimer.current) window.clearTimeout(promptTimer.current);
		promptTimer.current = window.setTimeout(() => setShippingPrompt(""), 6500);
	};
	const dismissPrompt = () => {
		if (promptTimer.current) window.clearTimeout(promptTimer.current);
		setShippingPrompt("");
	};
	const showCartFeedback = (id: number, message: string) => {
		if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
		setCartFeedback(previous => ({ id, message, key: (previous?.key || 0) + 1 }));
		feedbackTimer.current = window.setTimeout(() => setCartFeedback(null), 2200);
	};

	const updateQuantity = (id: number, delta: number) => setCart(prev => {
		const currentQuantity = prev[id] || 0;
		const updated = currentQuantity + delta;
		if (updated <= 0) {
			const copy = { ...prev };
			delete copy[id];
			if (currentQuantity > 0) {
				showCartFeedback(id, "Removed from cart");
			}
			return copy;
		}
		const nextQuantity = Math.min(STOCK_LIMIT, updated);
		if (delta > 0) {
			showCartFeedback(id, nextQuantity > currentQuantity ? "Added to cart" : "Cart updated");
		}
		return { ...prev, [id]: nextQuantity };
	});
	const addToCart = (id: number) => {
		setCart(prev => {
			const currentQuantity = prev[id] || 0;
			if (currentQuantity >= STOCK_LIMIT) {
				showCartFeedback(id, "Stock limit reached");
				return prev;
			}
			const nextQuantity = Math.min(STOCK_LIMIT, currentQuantity + 1);
			showCartFeedback(id, "Added to cart");
			return { ...prev, [id]: nextQuantity };
		});
	};
	const buyNow = (id: number) => {
		setCart(previous => {
			const currentQuantity = previous[id] || 0;
			const nextQuantity = Math.min(STOCK_LIMIT, currentQuantity + 1);
			showCartFeedback(id, "Ready in your cart");
			return { ...previous, [id]: nextQuantity };
		});
		scrollToPayment();
	};
	const clearCart = () => {
		setCart({});
		showPrompt("Cart cleared. You can start fresh anytime.");
	};
	const cartItemCount = Object.values(cart).reduce((totalCount, quantity) => totalCount + quantity, 0);
	const scrollToPayment = () => {
		document.querySelector(".checkout-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
	};
	const buyCartItem = (id: number) => {
		if (!cart[id]) return;
		scrollToPayment();
	};
	const buyFullCart = () => {
		if (!cartItemCount) {
			showPrompt("Your cart is waiting for one beautiful piece before checkout.");
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
	const createPendingUPIOrder = async (): Promise<{ orderId: string; upiUrl: string } | null> => {
		if (!Object.keys(cart).length) {
			showPrompt("Add a piece to your cart before checkout.");
			return null;
		}
		const missingField = !name.trim() ? "full name" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "a valid email for your receipt" : !/^\d{10,}$/.test(phone.replace(/\D/g, "")) ? "a valid mobile number" : !address.trim() || address.trim().length < 5 ? "a complete shipping address" : !/^\d{6}$/.test(pincode) ? "a 6-digit pincode" : "";
		if (missingField) {
			showPrompt(`Please enter ${missingField} to continue securely.`);
			document.querySelector(".shipping-fields")?.scrollIntoView({ behavior: "smooth", block: "center" });
			return null;
		}
		dismissPrompt();
		try {
			const response = await fetch("/api/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					cart,
					name,
					email,
					phone,
					address: `${address}${landmark ? `, ${landmark}` : ""}`,
					pincode,
					userId: session?.user?.id || null,
				}),
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Could not create pending order");
			if (!result.orderId || typeof result.upiUrl !== "string" || !result.upiUrl.startsWith("upi://pay?")) {
				throw new Error("The payment request could not be prepared. Please try again.");
			}
			return { orderId: String(result.orderId), upiUrl: result.upiUrl };
		} catch (error) {
			throw new Error(error instanceof Error ? error.message : "Unable to start payment.");
		}
	};

	return <div style={{ minHeight: "100vh", background: "#fdfbf7", color: "#111", fontFamily: "Georgia, serif", paddingBottom: 100 }}>
		<div className="trust-bar">ALL INDIA DELIVERY <span>•</span> TRUSTED AUTHENTIC BRAND <span>•</span> SECURE PAYMENTS</div>
		<header className="site-header" style={{ borderBottom: "1px solid #e6dcc3", padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", flexWrap: "nowrap", gap: 10 }}>
			<h1 className="brand-title" style={{ fontSize: 26, letterSpacing: 2, color: "#b38728", margin: 0 }}>TRENDY JEWELLERY</h1>
			<Link className="account-link" href={session ? "/dashboard" : "/login"}><span className="account-avatar">{session ? initials : "TJ"}</span><span><small>{session ? "Welcome back" : "Personal room"}</small><strong>{session ? displayName : "Log in / Sign up"}</strong></span></Link>
			<button className="cart-badge" type="button" aria-label={`${cartItemCount} items in cart. Review cart and checkout.`} onClick={scrollToPayment}><span aria-hidden="true">🛍</span> Cart <b>{cartItemCount}</b></button>
		</header>
		<section className="hero-section">
			<div className="hero-copy">
				<p className="hero-kicker">THE EVERYDAY HEIRLOOM EDIT</p>
				<h2>A little brilliance, every day.</h2>
				<p>Hand-finished jewellery for moments that feel like yours.</p>
				<a className="hero-cta" href="#collection">Discover the collection <span aria-hidden="true">↘</span></a>
			</div>
			<div className="hero-art" aria-hidden="true"><img src="/item3.jpg" alt="" /></div>
		</section>
		<main style={{ maxWidth: 1200, margin: "40px auto", padding: "0 20px", display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(300px, 1fr)", gap: 40, alignItems: "start" }}>
			<div className="catalog-column" id="collection"><div className="product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>{PRODUCTS.map(product => { const quantity = cart[product.id] || 0; return <div key={product.id} className="luxury-card product-card" data-reveal style={{ background: "#fff", border: "1px solid #e6dcc3", borderRadius: 12, padding: 20 }}><ProductImage src={product.image} alt={product.name} />
				<h3>{product.name}</h3>
				<p>{product.desc}</p>
				<strong style={{ color: "#b38728" }}>₹{product.price.toLocaleString("en-IN")}</strong>
				<p className="stock-note">{STOCK_LIMIT - quantity} available</p>
				<div className="product-actions">
					<button className="quantity-button" onClick={() => updateQuantity(product.id, -1)}>-</button> <span>{quantity}</span> <button className="quantity-button" onClick={() => addToCart(product.id)} disabled={quantity >= STOCK_LIMIT}>+</button>
					<button className="button button-dark" onClick={() => addToCart(product.id)} disabled={quantity >= STOCK_LIMIT}>Add to cart</button>
					<button className="button button-gold buy-button" onClick={() => buyNow(product.id)}>Buy Now ⚡</button>
				</div>
				{product.id === 6 && <div className="price-alert">
					<span className="zigzag-line" aria-hidden="true" />
					<strong>Price-watch pick</strong>
					<span>Beautiful everyday style at just ₹{product.price.toLocaleString("en-IN")}</span>
				</div>}
			</div>; })}</div>
			<section className="suggestions-section" data-reveal>
				<div className="section-heading">
					<div><p className="section-kicker">STYLE EDIT</p><h2>More pieces to love</h2></div>
					<span>Curated for you</span>
				</div>
				<div className="suggestion-grid">{SUGGESTED_PRODUCT_IDS.map(id => { const product = PRODUCTS.find(item => item.id === id)!; return <button className="suggestion-card" key={product.id} onClick={() => addToCart(product.id)}>
					<img src={product.image} alt="" />
					<span><strong>{product.name}</strong><small>₹{product.price.toLocaleString("en-IN")}</small></span>
					<b aria-hidden="true">+</b>
				</button>; })}</div>
			</section></div>
			<aside className="checkout-panel" id="checkout" data-reveal style={{ background: "#fff", border: "1px solid #e6dcc3", borderRadius: 12, padding: 30, height: "fit-content" }}>
				<h3>Your Cart <span className="cart-panel-count">{cartItemCount} item{cartItemCount === 1 ? "" : "s"}</span></h3>
				<div className="cart-items">{Object.entries(cart).length ? Object.entries(cart).map(([id, qty]) => { const item = PRODUCTS.find(p => p.id === Number(id))!; return <div className="cart-item" key={id}>
					<img src={item.image} alt={item.name} />
					<div className="cart-item-info">
						<strong>{item.name}</strong>
						<small>{item.desc}</small>
						<span>₹{item.price.toLocaleString("en-IN")} each</span>
						<div className="cart-item-actions">
							<button className="quantity-button" onClick={() => updateQuantity(item.id, -1)}>-</button>
							<b>{qty}</b>
							<button className="quantity-button" onClick={() => addToCart(item.id)} disabled={qty >= STOCK_LIMIT}>+</button>
							<strong>₹{(item.price * qty).toLocaleString("en-IN")}</strong>
							<button className="cart-buy-item" onClick={() => buyCartItem(item.id)}>Buy this item</button>
						</div>
					</div>
				</div>; }) : <p className="empty-cart">Your cart is empty. Add a piece to begin.</p>}
				</div>
				{cartItemCount > 0 && <button className="buy-full-cart" onClick={buyFullCart}>Buy full cart <span>({cartItemCount} items)</span></button>}
				<div className="shipping-fields">
					<h3>Secure Checkout & Shipping</h3>
					<input className="form-input" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
					<input className="form-input" type="email" placeholder="Email Address (order receipt)" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
					<input className="form-input" placeholder="Mobile Number" value={phone} onChange={e => setPhone(e.target.value)} required />
					<input className="form-input" placeholder="Alternate Mobile Number (Optional)" value={altPhone} onChange={e => setAltPhone(e.target.value)} />
					<textarea className="form-input address-input" placeholder="Detailed Shipping Address" value={address} onChange={e => setAddress(e.target.value)} required />
					<input className="form-input" placeholder="6-digit Pincode" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} required />
					<input className="form-input" placeholder="Nearby Landmark (Optional)" value={landmark} onChange={e => setLandmark(e.target.value)} />
				</div>
				<h4>Order Summary</h4>
				<p className="summary-line">{cartItemCount} item{cartItemCount === 1 ? "" : "s"} selected</p>
				<hr />
				<p>Subtotal: ₹{subtotal.toLocaleString("en-IN")}</p>
				<p>Estimated IGST (3%): ₹{igst.toLocaleString("en-IN")}</p>
				<strong>Total Amount: ₹{total.toLocaleString("en-IN")}</strong>
				<br />
				<div className="gemini-strip payment-gateway">
					{cartItemCount > 0 && (
						<button type="button" onClick={clearCart} style={{ marginBottom: 12, width: "100%", padding: "10px 12px", border: "1px solid #d8d0c7", background: "#faf7f2", color: "#3c2d23", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
							Clear cart
						</button>
					)}
					<UPICheckoutButton amount={total} onPaymentInitiated={createPendingUPIOrder} />
				</div>
			</aside>
		</main>
		<a className="store-whatsapp" href="https://wa.me/919279566257" target="_blank" rel="noopener noreferrer" style={{ position: "fixed", bottom: 30, right: 30, fontSize: 30 }}>
			💬
		</a>
		{cartFeedback && <div className="cart-feedback" key={cartFeedback.key} role="status"><img src={PRODUCTS.find(product => product.id === cartFeedback.id)?.image} alt="" /><div><small>Cart update</small><span>{cartFeedback.message}</span></div><b aria-hidden="true">🛍</b></div>}
		{cartItemCount > 0 && <button className="quick-checkout-shortcut" type="button" onClick={scrollToPayment}><span>{cartItemCount} item{cartItemCount === 1 ? "" : "s"} · ₹{total.toLocaleString("en-IN")}</span><strong>Review cart &amp; checkout</strong></button>}
		{shippingPrompt && <div className="shipping-prompt" role="alert"><div><strong>Almost ready</strong><span>{shippingPrompt}</span></div><button type="button" aria-label="Dismiss message" onClick={dismissPrompt}>Dismiss</button></div>}
	</div>;
}
