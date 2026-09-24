export type PasswordStrength = "weak" | "normal" | "strong";

export const getPasswordChecks = (password: string) => ({
	length: password.length >= 8,
	lowercase: /[a-z]/.test(password),
	uppercase: /[A-Z]/.test(password),
	number: /\d/.test(password),
	symbol: /[^A-Za-z0-9]/.test(password),
});

export const getPasswordStrength = (password: string): PasswordStrength => {
	const checks = getPasswordChecks(password);
	const score = Object.values(checks).filter(Boolean).length;
	if (score >= 5 && password.length >= 12) return "strong";
	if (score >= 3) return "normal";
	return "weak";
};

export const isPasswordValid = (password: string) => {
	const checks = getPasswordChecks(password);
	return checks.length && checks.lowercase && checks.uppercase && checks.number;
};
