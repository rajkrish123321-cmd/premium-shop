"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase-browser";

export default function ResetPasswordPage() {
	const [password, setPassword] = useState("");
	const [confirmation, setConfirmation] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		setMessage("");
		if (password.length < 8) return setError("Your password must be at least 8 characters.");
		if (password !== confirmation) return setError("The passwords do not match.");

		setSaving(true);
		const { error: updateError } = await supabase.auth.updateUser({ password });
		setSaving(false);
		if (updateError) {
			setError(updateError.message);
			return;
		}
		setMessage("Password updated successfully. You can now return to the store.");
		setPassword("");
		setConfirmation("");
	};

	return <main className="auth-page"><section className="auth-card"><p className="section-kicker">ACCOUNT SECURITY</p><h1>Choose a new password</h1><p>Use a password of at least 8 characters.</p><form onSubmit={handleSubmit}><label>New password<input className="form-input" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" required /></label><label>Confirm password<input className="form-input" type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="new-password" required /></label><button className="checkout-button" type="submit" disabled={saving}>{saving ? "Updating..." : "Update password"}</button></form>{error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}<Link href="/">Return to store</Link></section></main>;
}
