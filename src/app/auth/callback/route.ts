import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    console.log('Auth Callback started', { code: !!code, next });

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            console.log('Auth exchange successful, redirecting to:', next);
            return NextResponse.redirect(`${origin}${next}`);
        } else {
            console.error('Auth exchange error:', error);
            return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
        }
    }

    // Return to login on error
    console.log('No code found in callback, redirecting to login');
    return NextResponse.redirect(`${origin}/login?error=No+authentication+code+received`);
}
