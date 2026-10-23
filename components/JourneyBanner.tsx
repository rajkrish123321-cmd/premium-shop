"use client";

import { motion } from "framer-motion";

const journeySteps = ["Secure checkout", "Premium packaging", "Fast insured delivery"];

export function JourneyBanner() {
	return (
		<div className="journey-banner" aria-label="Secure checkout, premium packaging, fast insured delivery">
			<motion.div
				className="journey-banner-track"
				initial={{ x: "0%" }}
				animate={{ x: "-50%" }}
				transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
				aria-hidden="true"
			>
				{[0, 1].map(copy => (
					<span className="journey-banner-group" key={copy}>
						{journeySteps.map(step => <span className="journey-banner-step" key={step}>✧ {step}</span>)}
					</span>
				))}
			</motion.div>
		</div>
	);
}
