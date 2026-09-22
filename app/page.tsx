"use client";

import React, { useMemo, useState } from "react";

type Product = {
	id: string;
	name: string;
	price: number;
	stock: number;
	images: string[];
	desc: string;
};

type Cart = Record<string, number>;

const PRODUCTS: Product[] = [
	{ id: "prod_1", name: "Akruti Collection Oxidised Navratri Damini Maangtikka", price: 599, stock: 20, images: ["/item1.jpg"], desc: "Stunning Oxidised Plated Finish." },
	{ id: "prod_2", name: "Etnico 18k Gold Plated Kundan Kamarband/Waist Chain", price: 426, stock: 20, images: ["/item2.jpg"], desc: "White Stone Studded Belly Chain for Women." },
	{ id: "prod_3", name: "Palak Art Heritage Austrian Stone Pearl Necklace Set", price: 1176, stock: 20, images: ["/item3.jpg"], desc: "White Pearl and Beads with Austrian Stone." },
	{ id: "prod_4", name: "Maharani Jewels Oxidised Pota Stone Pearl Jhumki", price: 305, stock: 20, images: ["/item4.jpg"], desc: "Black Pearl Jhumki Earrings." },
	{ id: "prod_5", name: "Darshana Jewels Oxidised Plated Dangler Earrings", price: 77, stock: 20, images: ["/item5.jpg"], desc: "Oxidised Dangler Earrings." },
	{ id: "prod_6", name: "Darshana Jewels Oxidised Plated Dangler Earrings Small", price: 52, stock: 20, images: ["/item6.jpg"], desc: "Oxidised Dangler Earrings." },
];

const SUPPORT_NUMBER = "919279566257";

export default function TrendyJewelleryStore() {
	const [cart, setCart] = useState<Cart>({});
	const [isCheckingOut, setIsCheckingOut] = useState(false);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [altPhone, setAltPhone] = useState("");
	const [address, setAddress] = useState("");
	const [landmark, setLandmark] = useState("");
	const [pincode, setPincode] = useState("");
	const [paymentStatus, setPaymentStatus] = useState("");

	const cartTotal = useMemo(() => Object.entries(cart).reduce((total, [id, quantity]) => {
		const product = PRODUCTS.find((item) => item.id === id);
		return total + (product ? product.price * quantity : 0);
	}, 0), [cart]);
	const cartItemCount = useMemo(() => Object.values(cart).reduce((total, quantity) => total + quantity, 0), [cart]);
	const taxes = useMemo(() => {
		const igst = pincode.length === 6 && cartTotal > 0 ? cartTotal * 0.03 : 0;
		return { igst, grandTotal: cartTotal + igst };
	}, [cartTotal, pincode]);
	const isCalculated = pincode.length === 6 && cartTotal > 0;
	const isFormComplete = name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && phone.length === 10 && address.trim().length >= 8 && pincode.length === 6 && isCalculated;

	const updateQuantity = (id: string, delta: number) => {
		const product = PRODUCTS.find((item) => item.id === id);
		if (!product) return;
		setCart((previousCart) => {
			const nextQuantity = (previousCart[id] ?? 0) + delta;
			if (nextQuantity > product.stock) {
				window.alert(`Only ${product.stock} units of ${product.name} are available.`);
				return previousCart;
			}
			const nextCart = { ...previousCart };
			if (nextQuantity <= 0) delete nextCart[id];
			else nextCart[id] = nextQuantity;
			return nextCart;
		});
	};

	const handlePayment = async () => {
		if (!isFormComplete) return;
		setPaymentStatus("Connecting to secure server...");
		try {
			const response = await fetch("/api/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ amount: Math.round(taxes.grandTotal * 100), name, email, phone, altPhone, address, landmark, pincode, cart }),
			});
			if (!response.ok) throw new Error("Checkout API request failed");
			const orderData = await response.json();
			if (!orderData.orderId || !orderData.keyId) throw new Error("Invalid checkout response");
			const loaded = await new Promise<boolean>((resolve) => {
				if ((window as any).Razorpay) return resolve(true);
				const script = document.createElement("script");
				script.src = "https://checkout.razorpay.com/v1/checkout.js";
				script.onload = () => resolve(true);
				script.onerror = () => resolve(false);
				document.body.appendChild(script);
			});
			if (!loaded) throw new Error("Razorpay failed to load");
			const razorpay = new (window as any).Razorpay({ key: orderData.keyId, amount: orderData.amount, currency: orderData.currency || "INR", name: "TRENDY JEWELLERY", order_id: orderData.orderId, handler: (paymentResponse: any) => { window.location.href = `/success?order_id=${paymentResponse.razorpay_payment_id}`; }, prefill: { name, email, contact: phone }, theme: { color: "#b38728" } });
			razorpay.open();
		} catch {
			setPaymentStatus("");
			window.alert("Checkout is ready, but the payment server is not connected yet. (Check your API Keys!)");
		}
	};

	return (
		<main style={{ minHeight: "100vh", padding: 40, fontFamily: "Arial, sans-serif" }}>
			<header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
				<h1 onClick={() => setIsCheckingOut(false)}>TRENDY JEWELLERY</h1>
				<button onClick={() => cartTotal > 0 && setIsCheckingOut(true)}>CART ({cartItemCount}) • ₹{cartTotal.toLocaleString("en-IN")}</button>
			</header>
			<a href={`https://wa.me/${SUPPORT_NUMBER}`} target="_blank" rel="noreferrer">WhatsApp Support</a>
			{!isCheckingOut ? (
				<>
					<h2>Elegance, Redefined.</h2>
					<section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
						{PRODUCTS.map((product) => <article key={product.id} style={{ padding: 16, border: "1px solid #eee" }}><img src={product.images[0]} alt={product.name} style={{ width: "100%", height: 280, objectFit: "cover" }} /><h3>{product.name}</h3><p>{product.desc}</p><strong>₹{product.price.toLocaleString("en-IN")}</strong><div>{cart[product.id] ? <><button onClick={() => updateQuantity(product.id, -1)}>−</button>{cart[product.id]}<button onClick={() => updateQuantity(product.id, 1)}>+</button></> : <button onClick={() => updateQuantity(product.id, 1)}>Add to Cart</button>} <button onClick={() => { updateQuantity(product.id, 1); setIsCheckingOut(true); }}>Buy Now</button></div></article>)}
					</section>
					{cartTotal > 0 && <button onClick={() => setIsCheckingOut(true)}>Proceed to Checkout</button>}
				</>
			) : <section><button onClick={() => setIsCheckingOut(false)}>← Back to Shop</button><h2>Checkout</h2><p>Subtotal: ₹{cartTotal.toLocaleString("en-IN")}</p><input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} /><input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} /><input placeholder="Primary Mobile" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} /><input placeholder="Full Shipping Address" value={address} onChange={(e) => setAddress(e.target.value)} /><input placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} /><p>Total: ₹{taxes.grandTotal.toFixed(2)}</p><button disabled={!isFormComplete} onClick={handlePayment}>{paymentStatus || "Securely Pay"}</button></section>}
		</main>
	);
}
