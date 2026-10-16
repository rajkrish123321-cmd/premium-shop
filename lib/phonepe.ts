import { createHash, timingSafeEqual } from "node:crypto";

type PhonePeEnvironment = "sandbox" | "production";

type PhonePeOrderStatus = {
	merchantOrderId?: string;
	state?: string;
	amount?: number;
	orderId?: string;
	paymentDetails?: Array<{ transactionId?: string; state?: string }>;
};

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPhonePeConfig() {
	const merchantId = process.env.PHONEPE_MERCHANT_ID;
	const saltKey = process.env.PHONEPE_SALT_KEY;
	const saltIndex = process.env.PHONEPE_SALT_INDEX;
	const environment: PhonePeEnvironment = process.env.PHONEPE_ENV === "sandbox" ? "sandbox" : "production";

	if (!merchantId || !saltKey || !saltIndex) {
		throw new Error("PhonePe checkout is not configured. Set PHONEPE_MERCHANT_ID, PHONEPE_SALT_KEY, and PHONEPE_SALT_INDEX.");
	}

	const apiBase = environment === "sandbox"
		? "https://api-preprod.phonepe.com/apis/pg-sandbox"
		: "https://api.phonepe.com/apis/hermes";

	return { apiBase, merchantId, saltKey, saltIndex };
}

function sha256(value: string) {
	return createHash("sha256").update(value).digest("hex");
}

function createPayChecksum(payloadBase64: string, saltKey: string, saltIndex: string) {
	return `${sha256(`${payloadBase64}/pg/v1/pay${saltKey}`)}###${saltIndex}`;
}

function createStatusChecksum(path: string, saltKey: string, saltIndex: string) {
	return `${sha256(`${path}${saltKey}`)}###${saltIndex}`;
}

export function verifyPhonePeCallback(responsePayload: string, suppliedChecksum: string) {
	const { saltKey, saltIndex } = getPhonePeConfig();
	const expected = sha256(`${responsePayload}${saltKey}`) + `###${saltIndex}`;
	const expectedBuffer = Buffer.from(expected);
	const suppliedBuffer = Buffer.from(suppliedChecksum);
	return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

async function readPhonePeResponse(response: Response) {
	try {
		const result: unknown = await response.json();
		if (!isJsonObject(result)) throw new Error("Response is not a JSON object.");
		return result;
	} catch {
		throw new Error(`PhonePe returned an unreadable response (${response.status}).`);
	}
}

export async function createPhonePePayment({
	orderId,
	amount,
	redirectUrl,
	callbackUrl,
	phone,
}: {
	orderId: string;
	amount: number;
	redirectUrl: string;
	callbackUrl: string;
	phone: string;
}) {
	const config = getPhonePeConfig();
	const path = "/pg/v1/pay";
	const phoneNumber = phone.replace(/\D/g, "").slice(-10);
	const payload = {
		merchantId: config.merchantId,
		merchantTransactionId: orderId,
		merchantUserId: orderId,
		amount: Math.round(amount * 100),
		redirectUrl,
		redirectMode: "REDIRECT",
		callbackUrl,
		...(phoneNumber ? { mobileNumber: phoneNumber } : {}),
		paymentInstrument: { type: "PAY_PAGE" },
	};
	const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
	const response = await fetch(`${config.apiBase}${path}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-VERIFY": createPayChecksum(payloadBase64, config.saltKey, config.saltIndex),
		},
		body: JSON.stringify({ request: payloadBase64 }),
		cache: "no-store",
	});
	const result = await readPhonePeResponse(response);
	const data = isJsonObject(result.data) ? result.data : {};
	const instrumentResponse = isJsonObject(data.instrumentResponse) ? data.instrumentResponse : {};
	const redirectInfo = isJsonObject(instrumentResponse.redirectInfo) ? instrumentResponse.redirectInfo : {};
	const paymentUrl = redirectInfo.url;

	if (!response.ok || result.success !== true || typeof paymentUrl !== "string" || !paymentUrl.startsWith("https://")) {
		console.error("PhonePe payment request failed:", response.status);
		throw new Error("PhonePe could not start checkout. Please try again.");
	}

	return paymentUrl;
}

export async function getPhonePeOrderStatus(orderId: string) {
	const config = getPhonePeConfig();
	const path = `/pg/v1/status/${config.merchantId}/${encodeURIComponent(orderId)}`;
	const response = await fetch(`${config.apiBase}${path}`, {
		headers: {
			"Content-Type": "application/json",
			"X-VERIFY": createStatusChecksum(path, config.saltKey, config.saltIndex),
			"X-MERCHANT-ID": config.merchantId,
		},
		cache: "no-store",
	});
	const result = await readPhonePeResponse(response);

	if (!response.ok || result.success !== true || !result.data) {
		console.error("PhonePe status request failed:", response.status);
		throw new Error("Unable to confirm payment with PhonePe yet.");
	}

	const data = isJsonObject(result.data) ? result.data : {};
	const responseCode = typeof data.responseCode === "string"
		? data.responseCode
		: typeof result.code === "string"
			? result.code
			: "";
	const state = data.state === "COMPLETED" || responseCode === "PAYMENT_SUCCESS"
		? "COMPLETED"
		: data.state === "FAILED" || responseCode === "PAYMENT_ERROR"
			? "FAILED"
			: "PENDING";
	return {
		merchantOrderId: typeof data.merchantTransactionId === "string"
			? data.merchantTransactionId
			: typeof result.merchantTransactionId === "string"
				? result.merchantTransactionId
				: undefined,
		state,
		amount: typeof data.amount === "number" ? data.amount : undefined,
		orderId: typeof data.transactionId === "string" ? data.transactionId : undefined,
		paymentDetails: data.paymentInstrument ? [{ transactionId: typeof data.transactionId === "string" ? data.transactionId : undefined, state }] : [],
	} satisfies PhonePeOrderStatus;
}