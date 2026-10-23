/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

import UPICheckoutButton from "@/components/UPICheckoutButton";

type ProductSpecification = { label: string; value: string };
type Product = {
	id: number;
	name: string;
	category: string;
	finish: string;
	price: number;
	image: string;
	editorialImage: string;
	desc: string;
	use: string;
	wear: string;
	quality: string;
	specifications?: ProductSpecification[];
};

const PRODUCTS: Product[] = [
	{ id: 1, name: "Akruti Oxidised Damini Maangtikka", category: "Maang Tikka", finish: "Oxidised", price: Math.round(428 * 1.4), image: "/item1.jpg", editorialImage: "/item1-alt.jpg", desc: "A traditional oxidised-finish damini maang tikka that brings graceful detail to festive and wedding hairstyles.", use: "Style along the hair parting with a saree, lehenga or other traditional outfit.", wear: "Occasional wear · weddings, Navratri and celebrations.", quality: "Decorative damini design with an oxidised-plated finish." },
	{ id: 2, name: "Etnico Kundan Kamarband", category: "Waist Chains", finish: "Kundan", price: Math.round(304 * 1.4), image: "/item2.jpg", editorialImage: "/item2-alt.jpg", desc: "A Kundan waist chain with pearl drops for wedding and festive looks.", use: "Wear around the waist over a saree, lehenga or bridal outfit; adjust the hook and chain for a comfortable fit.", wear: "Ideal for weddings, festive celebrations, grand functions and bridal wear.", quality: "Traditional royal Kundan work with intricate floral and geometric motifs.", specifications: [{ label: "Design", value: "Traditional royal Kundan work with intricate floral and geometric motifs." }, { label: "Material", value: "High-quality alloy base with premium gold-tone plating." }, { label: "Embellishments", value: "Sparkling Kundan stones with faux pearl and bead drops." }, { label: "Closure", value: "Adjustable hook and chain for a comfortable fit." }, { label: "Occasion", value: "Weddings, festive celebrations, grand functions and bridal wear." }] },
	{ id: 3, name: "Palak Art Austrian Stone Necklace", category: "Necklaces", finish: "Stone", price: Math.round(840 * 1.4), image: "/item3.jpg", editorialImage: "/item3-alt.jpg", desc: "A statement necklace with Austrian-style stones, pearls and bead accents.", use: "Wear at the neckline to finish festive outfits, party looks and special-occasion styles.", wear: "Occasional wear · parties, ceremonies and celebrations.", quality: "Austrian-style stones with pearl and bead accents." },
	{ id: 4, name: "Maharani Oxidised Stone Jhumki", category: "Jhumki Earrings", finish: "Oxidised", price: Math.round(218 * 1.4), image: "/item4.jpg", editorialImage: "/item4-alt.jpg", desc: "Oxidised-look jhumkis with pota stones and pearl drops.", use: "Pair with ethnic outfits; fasten gently through the ear piercing.", wear: "Occasional wear · festive days and evening events.", quality: "Oxidised-look jhumki with pota stones and pearl drops." },
	{ id: 5, name: "Darshana Oxidised Dangler (Type A)", category: "Dangler Earrings", finish: "Oxidised", price: Math.round(55 * 1.4), image: "/item5.jpg", editorialImage: "/item5-alt.jpg", desc: "Classic oxidised-finish danglers for everyday and traditional looks.", use: "Add a statement finish to everyday outfits, kurtas or traditional occasionwear.", wear: "Regular or occasional wear · style to suit your day.", quality: "Classic dangler shape with an oxidised-plated finish." },
	{ id: 6, name: "Darshana Oxidised Dangler (Type B)", category: "Dangler Earrings", finish: "Oxidised", price: Math.round(37 * 1.4), image: "/item6.jpg", editorialImage: "/item6-alt.jpg", desc: "Lightweight oxidised-look danglers for easy daily styling.", use: "A lightweight pair for everyday outfits and easy styling.", wear: "Regular wear · suitable for daily outings.", quality: "Lightweight design with an oxidised-plated finish." },
];

const PRODUCT_CATEGORIES = ["All pieces", "Maang Tikka", "Earrings", "Necklaces", "Other"];
const PRODUCT_FINISHES = ["All finishes", "Oxidised", "Kundan", "Stone"];
const SUGGESTED_PRODUCT_IDS = [3, 4, 6];
const STOCK_LIMIT = 30;
const CART_STORAGE_KEY = "trendy-jewellery-cart-v1";
const PRODUCT_BLUR_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

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
	const [activeCategory, setActiveCategory] = useState("All pieces");
	const [activeFinish, setActiveFinish] = useState("All finishes");
	const [maxPrice, setMaxPrice] = useState(1200);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [detailImageZoomed, setDetailImageZoomed] = useState(false);
	const [mobileCheckoutOpen, setMobileCheckoutOpen] = useState(false);
	const [fullCartCheckoutLoading, setFullCartCheckoutLoading] = useState(false);
	const promptTimer = useRef<number | null>(null);
	const feedbackTimer = useRef<number | null>(null);
	const displayName = session?.user?.name?.trim() || session?.user?.email?.split("@")[0] || "Guest";
	const initials = displayName.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
	const categoryFor = (product: Product) => product.category.includes("Earrings") ? "Earrings" : product.category === "Necklaces" ? "Necklaces" : product.category === "Maang Tikka" ? "Maang Tikka" : "Other";
	const visibleProducts = PRODUCTS.filter(product =>
		(activeCategory === "All pieces" || categoryFor(product) === activeCategory) &&
		(activeFinish === "All finishes" || product.finish === activeFinish) &&
		product.price <= maxPrice,
	);

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
	}, [activeCategory, activeFinish, maxPrice]);

	useEffect(() => {
		if (!selectedProduct) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setSelectedProduct(null);
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => {
			window.removeEventListener("keydown", closeOnEscape);
			document.body.style.overflow = previousOverflow;
		};
	}, [selectedProduct]);

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
			if (Object.values(copy).reduce((count, quantity) => count + quantity, 0) === 0) setMobileCheckoutOpen(false);
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
	const buyProductNow = (id: number) => {
		addToCart(id);
		setMobileCheckoutOpen(true);
	};
	const clearCart = () => {
		setCart({});
		setMobileCheckoutOpen(false);
		showPrompt("Cart cleared. You can start fresh anytime.");
	};
	const cartItemCount = Object.values(cart).reduce((totalCount, quantity) => totalCount + quantity, 0);
	const scrollToPayment = () => {
		if (cartItemCount > 0 && window.matchMedia("(max-width: 699px)").matches) {
			setMobileCheckoutOpen(true);
			return;
		}
		const checkout = document.querySelector(".checkout-panel");
		if (checkout) checkout.scrollIntoView({ behavior: "smooth", block: "start" });
		else showPrompt("Your cart is empty. Add a piece to begin checkout.");
	};
	const buyCartItem = (id: number) => {
		if (!cart[id]) return;
		scrollToPayment();
	};
	const subtotal = Object.entries(cart).reduce((acc, [id, qty]) => {
		const product = PRODUCTS.find(p => p.id === Number(id));
		return acc + (product ? product.price * qty : 0);
	}, 0);
	const igst = Math.round(subtotal * 0.03);
	const total = subtotal + igst;
	const createPendingPhonePeOrder = async (): Promise<{ orderId: string; paymentUrl: string } | null> => {
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
			if (!result.orderId || typeof result.paymentUrl !== "string" || !result.paymentUrl.startsWith("https://")) {
				throw new Error("The payment request could not be prepared. Please try again.");
			}
			return { orderId: String(result.orderId), paymentUrl: result.paymentUrl };
		} catch (error) {
			throw new Error(error instanceof Error ? error.message : "Unable to start payment.");
		}
	};
	const handleFullCartCheckout = async () => {
		if (fullCartCheckoutLoading || !cartItemCount) return;
		setFullCartCheckoutLoading(true);
		try {
			const request = await createPendingPhonePeOrder();
			if (request) window.location.assign(request.paymentUrl);
		} catch (error) {
			showPrompt(error instanceof Error ? error.message : "Unable to start payment. Please try again.");
		} finally {
			setFullCartCheckoutLoading(false);
		}
	};
	const renderCheckoutPanel = (id?: string) => <aside className="checkout-panel" id={id}>
		<h3>Your Cart <span className="cart-panel-count">{cartItemCount} item{cartItemCount === 1 ? "" : "s"}</span></h3>
		<div className="cart-items">{Object.entries(cart).length ? Object.entries(cart).map(([itemId, qty]) => { const item = PRODUCTS.find(product => product.id === Number(itemId))!; return <div className="cart-item" key={itemId}>
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
		{cartItemCount > 0 && <button className="buy-full-cart" type="button" onClick={handleFullCartCheckout} disabled={fullCartCheckoutLoading || !cartItemCount} aria-busy={fullCartCheckoutLoading}>{fullCartCheckoutLoading ? <><span className="checkout-spinner" aria-hidden="true" /> Preparing secure payment...</> : <>Buy full cart <span>({cartItemCount} items)</span></>}</button>}
		<div className="shipping-fields">
			<h3>Secure Checkout & Shipping</h3>
			<input className="form-input" placeholder="Full Name" value={name} onChange={event => setName(event.target.value)} required />
			<input className="form-input" type="email" placeholder="Email Address (order receipt)" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required />
			<input className="form-input" placeholder="Mobile Number" value={phone} onChange={event => setPhone(event.target.value)} required />
			<input className="form-input" placeholder="Alternate Mobile Number (Optional)" value={altPhone} onChange={event => setAltPhone(event.target.value)} />
			<textarea className="form-input address-input" placeholder="Detailed Shipping Address" value={address} onChange={event => setAddress(event.target.value)} required />
			<input className="form-input" placeholder="6-digit Pincode" value={pincode} onChange={event => setPincode(event.target.value.replace(/\D/g, "").slice(0, 6))} required />
			<input className="form-input" placeholder="Nearby Landmark (Optional)" value={landmark} onChange={event => setLandmark(event.target.value)} />
		</div>
		<h4>Order Summary</h4>
		<p className="summary-line">{cartItemCount} item{cartItemCount === 1 ? "" : "s"} selected</p>
		<hr />
		<p>Subtotal: ₹{subtotal.toLocaleString("en-IN")}</p>
		<p>Estimated IGST (3%): ₹{igst.toLocaleString("en-IN")}</p>
		<strong>Total Amount: ₹{total.toLocaleString("en-IN")}</strong>
		<br />
		<div className="gemini-strip payment-gateway">
			{cartItemCount > 0 && <button type="button" onClick={clearCart} style={{ marginBottom: 12, width: "100%", padding: "10px 12px", border: "1px solid #d8d0c7", background: "#faf7f2", color: "#3c2d23", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Clear cart</button>}
			<UPICheckoutButton amount={total} onPaymentInitiated={createPendingPhonePeOrder} />
		</div>
	</aside>;

	return <Drawer open={mobileCheckoutOpen} onOpenChange={setMobileCheckoutOpen}><div className="storefront" id="top">
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
		<div className="trust-benefits" aria-label="Shopping benefits"><span><b aria-hidden="true">↺</b> 14-day easy returns</span><span><b aria-hidden="true">▣</b> Secure PhonePe payments</span><span><b aria-hidden="true">⌖</b> Delivery across India</span></div>
		<main className={`store-layout${cartItemCount ? " has-cart" : ""}`}>
			<aside className="filter-sidebar" aria-label="Product filters">
				<p className="section-kicker">REFINE YOUR EDIT</p>
				<fieldset><legend>Category</legend>{PRODUCT_CATEGORIES.map(category => <button key={category} type="button" className={activeCategory === category ? "filter-option is-active" : "filter-option"} aria-pressed={activeCategory === category} onClick={() => setActiveCategory(category)}>{category}</button>)}</fieldset>
				<fieldset><legend>Finish</legend>{PRODUCT_FINISHES.map(finish => <button key={finish} type="button" className={activeFinish === finish ? "filter-option is-active" : "filter-option"} aria-pressed={activeFinish === finish} onClick={() => setActiveFinish(finish)}>{finish}</button>)}</fieldset>
				<label className="price-filter">Price up to <strong>₹{maxPrice.toLocaleString("en-IN")}</strong><input type="range" min="100" max="1200" step="50" value={maxPrice} onChange={event => setMaxPrice(Number(event.target.value))} aria-label="Maximum price" /></label>
			</aside>
			<div className="catalog-column" id="collection">
				<div className="collection-toolbar">
					<div><p className="section-kicker">SHOP BY STYLE</p><h2>Find your finishing touch</h2></div>
					<span className="collection-count">{visibleProducts.length} {visibleProducts.length === 1 ? "piece" : "pieces"}</span>
				</div>
				<div className="category-filters" role="group" aria-label="Filter products by category">{PRODUCT_CATEGORIES.map(category => <button key={category} type="button" className={`category-chip${activeCategory === category ? " is-active" : ""}`} aria-pressed={activeCategory === category} onClick={() => setActiveCategory(category)}>{category}</button>)}</div>
				<div className="category-filters finish-filters" role="group" aria-label="Filter products by finish">{PRODUCT_FINISHES.map(finish => <button key={finish} type="button" className={`category-chip${activeFinish === finish ? " is-active" : ""}`} aria-pressed={activeFinish === finish} onClick={() => setActiveFinish(finish)}>{finish}</button>)}</div>
				<div className="product-grid">{visibleProducts.map(product => { const quantity = cart[product.id] || 0; return <motion.article key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.5, ease: "easeOut" }} whileHover={{ y: -5 }} className="luxury-card product-card" data-reveal>
					<div className="product-visual"><motion.button className="product-image-open" type="button" aria-label={`View details for ${product.name}`} whileTap={{ scale: 0.97 }} onClick={() => { setDetailImageZoomed(false); setSelectedProduct(product); }}><Image className="product-image-primary" src={product.image} alt="" fill sizes="(max-width: 699px) 100vw, (max-width: 1200px) 50vw, 25vw" placeholder="blur" blurDataURL={PRODUCT_BLUR_DATA_URL} /><Image className="product-image-alternate" src={product.editorialImage} alt="" fill sizes="(max-width: 699px) 100vw, (max-width: 1200px) 50vw, 25vw" placeholder="blur" blurDataURL={PRODUCT_BLUR_DATA_URL} /></motion.button><button className="quick-add" type="button" aria-label={`Add ${product.name} to cart`} onClick={() => addToCart(product.id)} disabled={quantity >= STOCK_LIMIT}>+</button></div>
					<div className="product-card-copy"><span className="product-category">{product.category}</span><h3>{product.name}</h3><p className="product-short-description">{product.desc}</p><strong className="product-price">₹{product.price.toLocaleString("en-IN")}</strong><div className="product-card-actions"><button className="product-add-button product-add-button-secondary" type="button" onClick={() => addToCart(product.id)} disabled={quantity >= STOCK_LIMIT}>{quantity ? `Add · ${quantity} in bag` : "Add to cart"}</button><button className="product-buy-button" type="button" onClick={() => buyProductNow(product.id)} disabled={quantity >= STOCK_LIMIT}>Buy now</button></div><button className="view-details" type="button" onClick={() => { setDetailImageZoomed(false); setSelectedProduct(product); }}>View details <span aria-hidden="true">↗</span></button></div>
				</motion.article>; })}</div>
				{visibleProducts.length === 0 && <p className="empty-filter-result">No pieces match these filters.</p>}
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
			</section>
			<section className="customer-policies" id="returns" data-reveal aria-labelledby="customer-policies-title">
				<div><p className="section-kicker">A LITTLE MORE ASSURANCE</p><h2 id="customer-policies-title">Your purchase, thoughtfully covered</h2></div>
				<div className="policy-grid">
					<article><h3>Custom purchase certificate</h3><p>A custom certificate identifying your purchased product will be included in the parcel with your jewellery.</p></article>
					<article><h3>14-day return, replacement or refund</h3><p>No questions asked. Contact us within 14 days of delivery to request a return and choose a replacement or refund.</p></article>
					<article><h3>Simple jewellery care</h3><p>Keep pieces away from water, perfume and cosmetics. Wipe gently after wear and store separately in a dry place.</p></article>
				</div>
			</section></div>
			{cartItemCount > 0 && renderCheckoutPanel("checkout")}
		</main>
		<a className="store-whatsapp" href="https://wa.me/919279566257" target="_blank" rel="noopener noreferrer" style={{ position: "fixed", bottom: 30, right: 30, fontSize: 30 }}>
			💬
		</a>
		{cartFeedback && <div className="cart-feedback" key={cartFeedback.key} role="status"><img src={PRODUCTS.find(product => product.id === cartFeedback.id)?.image} alt="" /><div><small>Cart update</small><span>{cartFeedback.message}</span></div><b aria-hidden="true">🛍</b></div>}
		{cartItemCount > 0 && !mobileCheckoutOpen && <DrawerTrigger asChild><button className="quick-checkout-shortcut" type="button"><span>{cartItemCount} item{cartItemCount === 1 ? "" : "s"} · ₹{total.toLocaleString("en-IN")}</span><strong>Review cart &amp; checkout</strong></button></DrawerTrigger>}
		{selectedProduct && <div className="detail-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedProduct(null); }}><section className="product-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="detail-title"><button className="detail-close" type="button" aria-label="Close product details" onClick={() => setSelectedProduct(null)}>×</button><button className={`detail-image-button${detailImageZoomed ? " is-zoomed" : ""}`} type="button" aria-label={detailImageZoomed ? "Zoom out of product image" : "Zoom in on product image"} aria-pressed={detailImageZoomed} onClick={() => setDetailImageZoomed(value => !value)}><img className="detail-image" src={selectedProduct.image} alt={selectedProduct.name} /><span>{detailImageZoomed ? "Tap to zoom out" : "Tap image to zoom"}</span></button><div className="detail-content"><span className="product-category">{selectedProduct.category} · {selectedProduct.finish}</span><h2 id="detail-title">{selectedProduct.name}</h2><p className="detail-description">{selectedProduct.desc}</p><div className="product-details">{selectedProduct.specifications ? selectedProduct.specifications.map(specification => <p key={specification.label}><strong>{specification.label}</strong>{specification.value}</p>) : <><p><strong>How to wear</strong>{selectedProduct.use}</p><p><strong>Wear frequency</strong>{selectedProduct.wear}</p><p><strong>Finish &amp; detail</strong>{selectedProduct.quality}</p></>}<p><strong>Care</strong>Keep away from water, perfume and cosmetics. Wipe gently after wear and store separately in a dry place.</p></div><div className="detail-purchase"><strong>₹{selectedProduct.price.toLocaleString("en-IN")}</strong><button className="product-add-button" type="button" onClick={() => addToCart(selectedProduct.id)} disabled={(cart[selectedProduct.id] || 0) >= STOCK_LIMIT}>Add to bag</button></div></div></section></div>}
		<nav className="mobile-bottom-nav" aria-label="Primary navigation"><Link href="/#top"><span aria-hidden="true">⌂</span>Home</Link><a href="#collection"><span aria-hidden="true">▦</span>Shop</a><button type="button" onClick={scrollToPayment}><span className="mobile-cart-icon" aria-hidden="true">♧{cartItemCount > 0 && <b>{cartItemCount}</b>}</span>Cart</button><Link href={session ? "/dashboard" : "/login"}><span aria-hidden="true">◉</span>Account</Link></nav>
		{shippingPrompt && <div className="shipping-prompt" role="alert"><div><strong>Almost ready</strong><span>{shippingPrompt}</span></div><button type="button" aria-label="Dismiss message" onClick={dismissPrompt}>Dismiss</button></div>}
	</div><DrawerContent className="mobile-checkout-drawer"><DrawerHeader><DrawerTitle>Secure checkout</DrawerTitle></DrawerHeader>{cartItemCount > 0 && renderCheckoutPanel()}</DrawerContent></Drawer>;
}
