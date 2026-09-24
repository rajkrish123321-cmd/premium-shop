const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

export const supabaseUrl = configuredUrl.startsWith("https://")
	? configuredUrl
	: "https://j36YzXcDP5xthE.supabase.co";

export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
	|| (configuredUrl.startsWith("sb_publishable_") ? configuredUrl : "")
	|| process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
	|| "sb_publishable_placeholder";

export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
	|| (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith("sb_secret_") ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : "")
	|| supabasePublishableKey;
