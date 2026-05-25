import { NextRequest, NextResponse } from 'next/server';

// Server-side pixel operations using service key
// This is more trusted than client-side for validation

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const claimed = searchParams.get('claimed');

    let url = `${SUPABASE_URL}/rest/v1/pixels?select=*`;
    if (claimed === 'true') {
      url += '&claimed=eq.true';
    } else if (claimed === 'false') {
      url += '&claimed=eq.false';
    }

    const headers: Record<string, string> = {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
    };

    // Use service key if available for admin operations
    if (SUPABASE_SERVICE_KEY) {
      headers['Authorization'] = `Bearer ${SUPABASE_SERVICE_KEY}`;
    }

    const response = await fetch(url, { headers });
    const data = await response.json();

    return NextResponse.json({ pixels: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
