"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthExperience } from "./auth-experience";

export default function LoginPage() {
	return (
		<Suspense fallback={<main className="auth-page"><section className="auth-card"><p>Loading...</p></section></main>}>
			<LoginMode />
		</Suspense>
	);
}

function LoginMode() {
	const searchParams = useSearchParams();
	return <AuthExperience signUp={searchParams.get("mode") === "signup"} />;
}
