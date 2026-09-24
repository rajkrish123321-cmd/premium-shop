"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL || "https://j36YzXcDP5xthE.supabase.co",
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_placeholder",
);

export default function LoginPage() {
	const router = useRouter();
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleForgotPassword = async () => {
		setError("");
		setMessage("");
		if (!email.trim()) return setError("Enter your email address first.");
		setLoading(true);
		const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
			redirectTo: `${window.location.origin}/reset-password`,
		});
		setLoading(false);
		if (resetError) return setError(resetError.message);
		setMessage("Password reset link sent. Check your inbox.");
	};

	const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		setMessage("");
		setLoading(true);
		try {
			if (isSignUp) {
				const { error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
				if (signUpError) throw signUpError;
				setMessage("Registration successful. Check your email for a verification link.");
			} else {
				const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
				if (loginError) throw loginError;
				router.push("/dashboard");
			}
		} catch (authError) {
			setError(authError instanceof Error ? authError.message : "An authentication error occurred.");
		} finally {
			setLoading(false);
		}
	};

	return <main className="auth-page"><section className="auth-card"><p className="section-kicker">CUSTOMER ACCOUNT</p><h1>{isSignUp ? "Create an account" : "Welcome back"}</h1><form onSubmit={handleAuth}><label>Email address<input className="form-input" type="email" placeholder="Your email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required /></label><label>Password<input className="form-input" type="password" placeholder="Your password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={isSignUp ? "new-password" : "current-password"} minLength={8} required /></label><button className="checkout-button" type="submit" disabled={loading}>{loading ? "Processing..." : isSignUp ? "Sign up" : "Sign in"}</button></form>{!isSignUp && <button className="auth-link-button" type="button" onClick={handleForgotPassword} disabled={loading}>Forgot password?</button>}{error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}<button className="auth-link-button" type="button" onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}>{isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}</button><Link href="/">Return to store</Link></section></main>;
}
