import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const isAuthPage =
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/register') ||
        request.nextUrl.pathname.startsWith('/invite') ||
        request.nextUrl.pathname.startsWith('/auth');
    const isWebhook = request.nextUrl.pathname.startsWith('/api/webhooks');
    const isAuthApi = request.nextUrl.pathname.startsWith('/api/auth');
    const isInviteApi = request.nextUrl.pathname.startsWith('/api/team/invite');
    const isApi = request.nextUrl.pathname.startsWith('/api');

    // Webhooks, Invite APIs, and Auth APIs skip auth
    if (isWebhook || isAuthApi || isInviteApi) return supabaseResponse;

    // Other API routes return 401 if not authenticated  
    if (isApi && !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Redirect unauthenticated users to login
    if (!user && !isAuthPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Role-Based Access Control (RBAC) - Restrict Admin Routes for 'agent' role
    if (user && !isAuthPage && !isApi) {
        const adminRoutes = ['/canais', '/setores', '/equipe', '/configuracoes', '/simulador', '/logs'];
        const isTryingAdminRoute = adminRoutes.some(route => request.nextUrl.pathname.startsWith(route));

        if (isTryingAdminRoute) {
            // Check if user has 'agent' role in their metadata (we saved it on Registration)
            // Or fallback to database check if you prefer, but metadata is faster inside middleware:
            const role = user.user_metadata?.role;
            if (role === 'agent') {
                const url = request.nextUrl.clone();
                url.pathname = '/conversas';
                return NextResponse.redirect(url);
            }
        }
    }

    // Redirect authenticated users away from auth pages
    if (user && isAuthPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}
