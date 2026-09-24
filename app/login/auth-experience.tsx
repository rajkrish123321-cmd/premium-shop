"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { getPasswordChecks, getPasswordStrength, isPasswordValid } from "../../lib/password-strength";

export function AuthExperience({ signUp }: { signUp: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberedEmail, setRememberedEmail] = useState("");
  const checks = getPasswordChecks(password);

  useEffect(() => {
    const savedEmail = window.localStorage.getItem("premium-shop-email") || "";
    setRememberedEmail(savedEmail);
    setEmail(savedEmail);
  }, []);

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      const cleanEmail = String(formData.get("email") || "").trim().toLowerCase();
      const firstName = String(formData.get("firstName") || "").trim();
      const lastName = String(formData.get("lastName") || "").trim();
      if (signUp && (!firstName || !lastName)) throw new Error("Add your first and surname to personalise your account.");
      if (signUp && !isPasswordValid(password)) throw new Error("Use at least 8 characters with a lowercase letter, uppercase letter, and number.");
      if (signUp) {
        const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: cleanEmail, password, name: `${firstName} ${lastName}` }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Registration failed.");
      }
      const result = await signIn("credentials", { email: cleanEmail, password, redirect: false });
      if (result?.error) throw new Error(signUp ? "Account created, but sign-in failed. Please try again." : "Invalid email or password.");
      window.localStorage.setItem("premium-shop-email", cleanEmail);
      router.push("/dashboard");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const isReturning = Boolean(rememberedEmail && rememberedEmail === email.trim().toLowerCase());
  const strength = getPasswordStrength(password);

  return <main className="auth-page"><section className="auth-card"><div className="auth-brand"><span className="auth-brand-mark">TJ</span><div><strong>Trendy Jewellery</strong><small>Thoughtfully made for you</small></div></div><div className="auth-intro"><p className="section-kicker">YOUR PERSONAL JEWELLERY ROOM</p><h1>{signUp ? "Make it yours" : isReturning ? "Welcome back" : "Welcome in"}</h1><p>{signUp ? "Save favourites, follow every order and enjoy a more personal shopping experience." : isReturning ? `Good to see you again, ${email.split("@")[0]}.` : "Sign in to pick up where your jewellery story left off."}</p></div><div className="auth-switcher" role="tablist" aria-label="Account access"><Link className={!signUp ? "active" : ""} href="/login">Log in</Link><Link className={signUp ? "active" : ""} href="/login?mode=signup">Create account</Link></div><form onSubmit={handleAuth}>{signUp && <div className="name-fields"><label>First name<input name="firstName" className="form-input" placeholder="Soni" autoComplete="given-name" required /></label><label>Surname<input name="lastName" className="form-input" placeholder="Karosy" autoComplete="family-name" required /></label></div>}<label>Email address<input name="email" className="form-input" type="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required /></label><label>Password<div className="password-field"><input name="password" className="form-input" type={showPassword ? "text" : "password"} placeholder="Your password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={signUp ? "new-password" : "current-password"} minLength={8} required /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button></div>{signUp && <div className="password-guide"><div className={`password-meter password-meter-${strength}`}><span /></div><strong>{password ? `${strength} password` : "Password strength"}</strong><div className="password-checks"><span className={checks.length ? "check-pass" : ""}>8+ characters</span><span className={checks.lowercase ? "check-pass" : ""}>lowercase</span><span className={checks.uppercase ? "check-pass" : ""}>uppercase</span><span className={checks.number ? "check-pass" : ""}>number</span></div></div>}</label><button className="checkout-button" type="submit" disabled={loading}>{loading ? "Processing..." : signUp ? "Create my account" : "Enter my account"}</button></form>{error && <p className="auth-error" role="alert">{error}</p>}<Link className="auth-back-link" href="/">Back to the collection</Link></section></main>;
}
