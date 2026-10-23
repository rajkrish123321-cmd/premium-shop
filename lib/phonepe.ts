import { createHash, timingSafeEqual } from "node:crypto";

type PhonePeEnvironment = "sandbox" | "production";

type PhonePeOrderStatus = {
    merchantOrderId?: string;
    state?: string;
    amount?: number;
    orderId?: string;
    paymentDetails?: Array<{ transactionId?: string; state?: string }>;
};

let cachedAccessToken: { value: string; expiresAt: number } | null = null;
let accessTokenRequest: Promise<string> | null = null;

function getPhonePeConfig() {
    const clientId = process.env.PHONEPE_CLIENT_ID;
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
    // Default to "1" if not explicitly set in Vercel to prevent instant crashes
    const clientVersion = process.env.PHONEPE_CLIENT_VERSION || "1"; 
    const environment: PhonePeEnvironment = process.env.PHONEPE_ENV === "sandbox" ? "sandbox" : "production";

    if (!clientId || !clientSecret) {
        throw new Error("PhonePe checkout is not configured. Missing PHONEPE_CLIENT_ID or PHONEPE_CLIENT_SECRET.");
    }

    const apiBase = environment === "sandbox"
        ? "https://api-preprod.phonepe.com/apis/pg-sandbox"
        : "https://api.phonepe.com/apis/pg";
    const authUrl = environment === "sandbox"
        ? `${apiBase}/v1/oauth/token`
        : "https://api.phonepe.com/apis/identity-manager/v1/oauth/token";

    return { apiBase, authUrl, clientId, clientSecret, clientVersion };
}

async function requestAccessToken() {
    const config = getPhonePeConfig();
    const body = new URLSearchParams({
        client_id: config.clientId as string,
        client_version: config.clientVersion as string,
        client_secret: config.clientSecret as string,
        grant_type: "client_credentials",
    });

    const response = await fetch(config.authUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
    });
    
    // Check for HTTP errors and log the EXACT response from PhonePe
    if (!response.ok) {
        const errorText = await response.text();
        console.error("PhonePe Auth Failure:", { status: response.status, error: errorText });
        throw new Error("PhonePe Authorization Failed. Check Vercel Logs for details.");
    }

    const result = await response.json() as { access_token?: string; expires_at?: number; expires_in?: number };

    if (!result.access_token) {
        console.error("PhonePe returned success but missing access_token:", result);
        throw new Error("PhonePe Auth Failed: No access token provided.");
    }

    const expiresAt = result.expires_at
        ? result.expires_at * 1000
        : Date.now() + (result.expires_in ? result.expires_in * 1000 : 5 * 60 * 1000);
    cachedAccessToken = { value: result.access_token, expiresAt: expiresAt - 60_000 };
    return result.access_token;
}

export async function getPhonePeAccessToken() {
    if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
        return cachedAccessToken.value;
    }

    if (!accessTokenRequest) {
        accessTokenRequest = requestAccessToken().finally(() => {
            accessTokenRequest = null;
        });
    }

    return accessTokenRequest;
}

async function getAccessToken() {
    return { config: getPhonePeConfig(), accessToken: await getPhonePeAccessToken() };
}

export async function createPhonePePayment({
    orderId,
    amount,
    redirectUrl,
    accessToken,
}: {
    orderId: string;
    amount: number;
    redirectUrl: string;
    accessToken?: string;
}) {
    if (!orderId.trim() || !Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(Math.round(amount * 100))) {
        throw new Error("A valid order ID and payment amount are required.");
    }
    if (!redirectUrl.startsWith("https://")) {
        throw new Error("A secure checkout return URL is required.");
    }

    const config = getPhonePeConfig();
    const token = accessToken || await getPhonePeAccessToken();
    
    const requestBody = {
        merchantOrderId: orderId,
        amount: Math.round(amount * 100),
        expireAfter: 1200,
        paymentFlow: {
            type: "PG_CHECKOUT",
            merchantUrls: { redirectUrl },
        },
    };

    const response = await fetch(`${config.apiBase}/checkout/v2/pay`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `O-Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
        cache: "no-store",
    });
    
    // Capture the exact PhonePe failure reason if it crashes
    if (!response.ok) {
        const errorText = await response.text();
        console.error("PhonePe Checkout Failure:", { status: response.status, payload: requestBody, error: errorText });
        throw new Error("PhonePe Checkout Failed. Check Vercel Logs for details.");
    }

    const result = await response.json() as { redirectUrl?: string };

    if (typeof result.redirectUrl !== "string" || !result.redirectUrl.startsWith("https://")) {
        console.error("PhonePe Checkout Invalid Response:", result);
        throw new Error("PhonePe returned an invalid checkout URL.");
    }

    return result.redirectUrl;
}

export async function getPhonePeOrderStatus(orderId: string) {
    const { config, accessToken } = await getAccessToken();
    const endpoint = new URL(`${config.apiBase}/checkout/v2/order/${encodeURIComponent(orderId)}/status`);
    endpoint.searchParams.set("details", "true");
    
    const response = await fetch(endpoint.toString(), {
        headers: { Authorization: `O-Bearer ${accessToken}` },
        cache: "no-store",
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error("PhonePe Status Check Failure:", { status: response.status, error: errorText });
        throw new Error("Unable to confirm payment status.");
    }
    
    return (await response.json()) as PhonePeOrderStatus;
}

export function verifyPhonePeWebhookAuthorization(authorization: string) {
    const username = process.env.PHONEPE_WEBHOOK_USER;
    const password = process.env.PHONEPE_WEBHOOK_PASS;
    if (!username || !password || !authorization) return false;

    const expectedValues = [
        `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
        createHash("sha256").update(`${username}:${password}`).digest("hex"),
    ];

    return expectedValues.some(value => {
        const expected = Buffer.from(value);
        const received = Buffer.from(authorization);
        return expected.length === received.length && timingSafeEqual(expected, received);
    });
}

export async function createPhonePeRefund({
    merchantRefundId,
    originalMerchantOrderId,
    amount,
}: {
    merchantRefundId: string;
    originalMerchantOrderId: string;
    amount: number;
}) {
    const { config, accessToken } = await getAccessToken();
    const requestBody = { merchantRefundId, originalMerchantOrderId, amount };
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${accessToken}`,
    };
    if (process.env.PHONEPE_MERCHANT_ID) headers["X-MERCHANT-ID"] = process.env.PHONEPE_MERCHANT_ID;

    const response = await fetch(`${config.apiBase}/payments/v2/refund`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        cache: "no-store",
    });
    const responseText = await response.text();
    let result: { refundId?: string; state?: string } = {};
    try {
        result = responseText ? JSON.parse(responseText) as typeof result : {};
    } catch {
        console.error("PhonePe refund returned invalid JSON.", { status: response.status });
    }
    if (!response.ok) {
        console.error("PhonePe refund request failed.", { status: response.status, response: responseText });
    }
    return { ok: response.ok, ...result };
}