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

async function getAccessToken() {
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

    const result = await response.json() as { access_token?: string };

    if (!result.access_token) {
        console.error("PhonePe returned success but missing access_token:", result);
        throw new Error("PhonePe Auth Failed: No access token provided.");
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
            Authorization: `O-Bearer ${accessToken}`,
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