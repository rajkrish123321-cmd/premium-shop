type PhonePeEnvironment = "sandbox" | "production";

type PhonePeOrderStatus = {
	merchantOrderId?: string;
	state?: string;
	amount?: number;
	orderId?: string;
	paymentDetails?: Array<{ transactionId?: string; state?: string }>;
};

function getPhonePeConfig() {
	const clientId = process.env.PHONEPE_CLIENT_ID;
	const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
	const clientVersion = process.env.PHONEPE_CLIENT_VERSION;
	const environment: PhonePeEnvironment = process.env.PHONEPE_ENV === "sandbox" ? "sandbox" : "production";

	if (!clientId || !clientSecret || !clientVersion) {
		throw new Error("PhonePe checkout is not configured. Set PHONEPE_CLIENT_ID, PHONEPE_CLIENT_SECRET, and PHONEPE_CLIENT_VERSION.");
	}

	const apiBase = environment === "sandbox"
		? "https://api-preprod.phonepe.com/apis/pg-sandbox"
		: "https://api.phonepe.com/apis/pg";
	const authUrl = environment === "sandbox"
		? `${apiBase}/v1/oauth/token`
		: "https://api.phonepe.com/apis/identity-manager/v1/oauth/token";

	return { apiBase, authUrl, clientId, clientSecret, clientVersion };
}

async function getAccessToken() {
	const config = getPhonePeConfig();
	const body = new URLSearchParams({
		client_id: config.clientId,
		client_version: config.clientVersion,
		client_secret: config.clientSecret,
		grant_type: "client_credentials",
	});
	console.log("PhonePe OAuth request configuration:", {
		url: config.authUrl,
		clientId: config.clientId,
		clientVersion: config.clientVersion,
	});
	const response = await fetch(config.authUrl, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
		cache: "no-store",
	});
	const result = await response.json() as { access_token?: string };

	if (!response.ok || !result.access_token) {
		console.error("PhonePe token request failed:", response.status);
		throw new Error("PhonePe could not authorize this payment. Please try again later.");
	}

	return { config, accessToken: result.access_token };
}

export async function createPhonePePayment({
	orderId,
	amount,
	redirectUrl,
}: {
	orderId: string;
	amount: number;
	redirectUrl: string;
}) {
	const { config, accessToken } = await getAccessToken();
	const response = await fetch(`${config.apiBase}/checkout/v2/pay`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `O-Bearer ${accessToken}`,
		},
		body: JSON.stringify({
			merchantOrderId: orderId,
			amount: Math.round(amount * 100),
			expireAfter: 1200,
			paymentFlow: {
				type: "PG_CHECKOUT",
				merchantUrls: { redirectUrl },
			},
		}),
		cache: "no-store",
	});
	const result = await response.json() as { redirectUrl?: string };

	if (!response.ok || typeof result.redirectUrl !== "string" || !result.redirectUrl.startsWith("https://")) {
		console.error("PhonePe payment request failed:", response.status);
		throw new Error("PhonePe could not start checkout. Please try again.");
	}

	return result.redirectUrl;
}

export async function getPhonePeOrderStatus(orderId: string) {
	const { config, accessToken } = await getAccessToken();
	const endpoint = new URL(`${config.apiBase}/checkout/v2/order/${encodeURIComponent(orderId)}/status`);
	endpoint.searchParams.set("details", "true");
	const response = await fetch(endpoint, {
		headers: { Authorization: `O-Bearer ${accessToken}` },
		cache: "no-store",
	});
	const result = await response.json() as PhonePeOrderStatus;

	if (!response.ok) {
		console.error("PhonePe status request failed:", response.status);
		throw new Error("Unable to confirm payment with PhonePe yet.");
	}

	return result;
}