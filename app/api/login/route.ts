import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Safe initialization that avoids build-time URL crashes
const getSupabase = () => {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://j36YzXcDP5xthE.supabase.co";
	const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_placeholder";
	return createClient(url, key);
};

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { phone, name, age, gender } = body;

		if (!phone || !name) {
			return NextResponse.json({ error: 'Phone and Name are required' }, { status: 400 });
		}

		const supabase = getSupabase();
		const { data, error } = await supabase
			.from('customers')
			.upsert(
				{ phone, full_name: name, age: parseInt(age) || null, gender: gender || "Not Specified" },
				{ onConflict: 'phone' }
			)
			.select();

		if (error) throw error;

		return NextResponse.json({
			success: true,
			message: 'Account verified securely.',
			user: data ? data[0] : null,
		});
	} catch (error) {
		console.error('Database Error:', error);
		return NextResponse.json({ error: 'Failed to save account details' }, { status: 500 });
	}
}
