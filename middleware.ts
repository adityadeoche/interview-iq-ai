import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('CRITICAL: Supabase URL or Anon Key is missing in Middleware.');
        return response;
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // Use getSession() instead of getUser() to read from cookie without hitting Supabase API.
    // This avoids 429 rate-limit errors on every navigation.
    // getSession() is safe in middleware since the session is validated by the Supabase client
    // from the signed cookie — no network request needed.
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null

    // Protect all dashboard routes
    const protectedPaths = ['/dashboard', '/interview', '/recruiter', '/campus']

    // Only startsWith for these sub-routes
    const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

    // Handle Unauthenticated Redirects
    if (isProtectedPath && !user) {
        if (request.nextUrl.pathname.startsWith('/campus')) {
            return NextResponse.redirect(new URL('/login?portal=tpo', request.url))
        }
        if (request.nextUrl.pathname.startsWith('/recruiter')) {
            return NextResponse.redirect(new URL('/login?portal=recruiter', request.url))
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Role-based protection — only fetch profile if user is logged in
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, tenth_percent, twelfth_percent, grad_cgpa')
            .eq('id', user.id)
            .single()

        const role = profile?.role || user.user_metadata?.role || 'candidate'
        const isStudent = role === 'candidate' || role === 'student'

        // 1. If trying to access candidate spaces
        if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/interview')) {
            if (!isStudent) {
                const redirectUrl = role === 'recruiter' ? '/recruiter/dashboard' : '/campus/dashboard'
                return NextResponse.redirect(new URL(redirectUrl, request.url))
            }

            // 2. Integration with Eligibility Workflow
            // If student is logged in but missing academic data, force redirect to verification
            // EXCEPT if they are already on the verification page
            if (isStudent &&
                (!profile?.grad_cgpa || !profile?.tenth_percent || !profile?.twelfth_percent) &&
                request.nextUrl.pathname !== '/dashboard/profile/verify') {
                return NextResponse.redirect(new URL('/dashboard/profile/verify', request.url))
            }
        }

        // 3. Strict Enforcement for HR (Recruiter) and Campus (TPO) Dashboards
        if (request.nextUrl.pathname.startsWith('/recruiter')) {
            if (role !== 'recruiter') {
                return NextResponse.redirect(new URL('/?error=invalid_portal_recruiter', request.url))
            }
        }

        if (request.nextUrl.pathname.startsWith('/campus')) {
            if (role !== 'tpo') {
                return NextResponse.redirect(new URL('/?error=invalid_portal_tpo', request.url))
            }
        }

        // 4. Redirect logged-in users away from login/signup/root
        if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup' || request.nextUrl.pathname === '/') {
            const redirectUrl = isStudent ? '/dashboard' : (role === 'recruiter' ? '/recruiter/dashboard' : '/campus/dashboard')
            return NextResponse.redirect(new URL(redirectUrl, request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        '/',
        '/dashboard/:path*',
        '/interview/:path*',
        '/recruiter/:path*',
        '/campus/:path*',
        '/login',
        '/signup',
    ],
}
