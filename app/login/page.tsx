"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase-browser";
import { getPasswordChecks, getPasswordStrength, isPasswordValid } from "../../lib/password-strength";

export default function LoginPage() {
	const router = useRouter();
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const passwordChecks = getPasswordChecks(password);
	const passwordStrength = getPasswordStrength(password);

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
				if (!isPasswordValid(password)) throw new Error("Use at least 8 characters with a lowercase letter, uppercase letter, and number. A unique symbol makes it stronger.");
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

	return <main className="auth-page"><section className="auth-card"><p className="section-kicker">CUSTOMER ACCOUNT</p><h1>{isSignUp ? "Create an account" : "Welcome back"}</h1><form onSubmit={handleAuth}><label>Email address<input className="form-input" type="email" placeholder="Your email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required /></label><label>Password<div className="password-field"><input className="form-input" type={showPassword ? "text" : "password"} placeholder="Your password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={isSignUp ? "new-password" : "current-password"} minLength={8} required /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></div>{isSignUp && <div className="password-guide"><div className={`password-meter password-meter-${passwordStrength}`}><span /></div><strong>{password ? `${passwordStrength} password` : "Password strength"}</strong><div className="password-checks"><span className={passwordChecks.length ? "check-pass" : ""}>8+ characters</span><span className={passwordChecks.lowercase ? "check-pass" : ""}>lowercase</span><span className={passwordChecks.uppercase ? "check-pass" : ""}>uppercase</span><span className={passwordChecks.number ? "check-pass" : ""}>number</span><span className={passwordChecks.symbol ? "check-pass" : ""}>unique symbol (optional)</span></div></div>}</label><button className="checkout-button" type="submit" disabled={loading}>{loading ? "Processing..." : isSignUp ? "Sign up" : "Sign in"}</button></form>{!isSignUp && <button className="auth-link-button" type="button" onClick={handleForgotPassword} disabled={loading}>Forgot password?</button>}{error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}<button className="auth-link-button" type="button" onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); setPassword(""); }}>{isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}</button><Link href="/">Return to store</Link></section></main>;
}
