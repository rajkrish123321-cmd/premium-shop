const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

export const supabaseUrl = configuredUrl.startsWith("https://")
	? configuredUrl
	: "https://j36YzXcDP5xthE.supabase.co";

const configuredPublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const configuredAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabasePublishableKey = configuredPublishableKey.startsWith("sb_publishable_")
	? configuredPublishableKey
	: configuredAnonKey.startsWith("sb_publishable_")
		? configuredAnonKey
		: "sb_publishable_placeholder";

export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
	|| (configuredAnonKey.startsWith("sb_secret_") ? configuredAnonKey : "")
	|| "";
