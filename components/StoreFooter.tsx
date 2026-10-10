import Link from "next/link";

const INSTAGRAM_URL = "https://www.instagram.com/trendyjewellery777/";
const WHATSAPP_URL = "https://wa.me/919279566257";

export default function StoreFooter() {
	return <footer className="store-footer">
		<div className="store-footer-inner">
			<section className="footer-terms" id="terms-and-conditions" aria-labelledby="footer-terms-title">
				<p className="footer-kicker">PLEASE READ</p>
				<h2 id="footer-terms-title">Terms &amp; Conditions</h2>
				<p>Product details describe the design and finish of each fashion jewellery piece. A custom purchase certificate is included with the product; it is a purchase certificate, not an independent hallmark or gem-testing report.</p>
				<p>Returns are accepted within 14 days of delivery, with no questions asked. Contact us within that period to request a replacement or refund.</p>
				<Link className="footer-returns-link" href="/#returns">View return and care details <span aria-hidden="true">↗</span></Link>
			</section>
			<section className="footer-business" aria-labelledby="footer-business-title">
				<p className="footer-kicker">TRENDY JEWELLERY</p>
				<h2 id="footer-business-title">Business information</h2>
				<p><strong>Udyam Registration</strong><span>UDAYM-JH-01-0066016</span></p>
				<a href="mailto:trendyjewellery62@gmail.com">trendyjewellery62@gmail.com</a>
				<a href="tel:+919279566257">+91 92795 66257</a>
				<div className="footer-socials" aria-label="Social media">
					<a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram: trendyjewellery777">
						<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle className="social-icon-dot" cx="17.5" cy="6.5" r="1" /></svg>
						<span>@trendyjewellery777</span>
					</a>
					<a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp: +91 92795 66257">
						<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.8a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.3-4.9a8.4 8.4 0 1 1 16.2-3.8Z" /><path d="M8.2 7.8c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.8 1.8c.1.2.1.4-.1.6l-.6.7c-.2.2-.2.4-.1.6.4.8 1.1 1.5 1.9 1.9.2.1.4.1.6-.1l.8-1c.2-.2.4-.3.6-.2l1.8.9c.3.1.4.3.4.5 0 .5-.3 1.4-.8 1.8-.5.5-1.2.7-2 .6-1-.1-2.4-.7-3.8-1.9-1.2-1.1-2-2.4-2.3-3.4-.3-1 .1-2 .5-2.8Z" /></svg>
						<span>Chat on WhatsApp</span>
					</a>
				</div>
			</section>
		</div>
		<div className="footer-bottom"><span>Trendy Jewellery</span><Link href="/#collection">Shop the collection</Link></div>
	</footer>;
}