"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { getPasswordChecks, getPasswordStrength, isPasswordValid } from "../../lib/password-strength";
import { AuthExperience } from "./auth-experience";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
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
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim() }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to send reset instructions.");
      setMessage(result.message || "Password reset instructions have been prepared.");
    } catch (forgotError) {
      setError(forgotError instanceof Error ? forgotError.message : "Unable to send reset instructions.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (isSignUp) {
        if (!isPasswordValid(password)) throw new Error("Use at least 8 characters with a lowercase letter, uppercase letter, and number.");
        const registerResponse = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), password, name: email.trim() }) });
        const registerResult = await registerResponse.json();
        if (!registerResponse.ok) throw new Error(registerResult.error || "Registration failed.");
        const signInResult = await signIn("credentials", { email: email.trim(), password, redirect: false });
        if (signInResult?.error) throw new Error("Account created, but sign-in failed. Please try again.");
        setMessage("Registration successful. You are now signed in.");
        router.push("/dashboard");
        return;
      }
      const signInResult = await signIn("credentials", { email: email.trim(), password, redirect: false });
      if (signInResult?.error) throw new Error("Invalid email or password.");
      router.push("/dashboard");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return <main className="auth-page"><section className="auth-card"><p className="section-kicker">CUSTOMER ACCOUNT</p><h1>{isSignUp ? "Create an account" : "Welcome back"}</h1><form onSubmit={handleAuth}><label>Email address<input className="form-input" type="email" placeholder="Your email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><label>Password<div className="password-field"><input className="form-input" type={showPassword ? "text" : "password"} placeholder="Your password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isSignUp ? "new-password" : "current-password"} minLength={8} required /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></div>{isSignUp && <div className="password-guide"><div className={`password-meter password-meter-${passwordStrength}`}><span /></div><strong>{password ? `${passwordStrength} password` : "Password strength"}</strong><div className="password-checks"><span className={passwordChecks.length ? "check-pass" : ""}>8+ characters</span><span className={passwordChecks.lowercase ? "check-pass" : ""}>lowercase</span><span className={passwordChecks.uppercase ? "check-pass" : ""}>uppercase</span><span className={passwordChecks.number ? "check-pass" : ""}>number</span><span className={passwordChecks.symbol ? "check-pass" : ""}>unique symbol (optional)</span></div></div>}</label><button className="checkout-button" type="submit" disabled={loading}>{loading ? "Processing..." : isSignUp ? "Sign up" : "Sign in"}</button></form>{!isSignUp && <button className="auth-link-button" type="button" onClick={handleForgotPassword} disabled={loading}>Forgot password?</button>}{error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}<button className="auth-link-button" type="button" onClick={() => setIsSignUp(!isSignUp)}>{isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}</button><Link href="/">Return to store</Link></section></main>;
}

export default function LoginPage() {
  return <Suspense fallback={<main className="auth-page"><section className="auth-card"><p>Loading...</p></section></main>}><LoginMode /></Suspense>;
}

function LoginMode() {
  const searchParams = useSearchParams();
  return <AuthExperience signUp={searchParams.get("mode") === "signup"} />;
}
