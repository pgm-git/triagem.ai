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
        }
    }

    // Return to login on error with an error code for the UI
    console.log('Auth failed, redirecting to login');
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
