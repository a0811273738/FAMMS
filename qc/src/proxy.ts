import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Auth guard + session refresh. (Next 16 renamed the "middleware" convention
// to "proxy" — same behavior.) Runs on EVERY page navigation, so it must not
// add a network round-trip: getClaims() verifies the session JWT locally
// (cached JWKS) and only hits the network when the token has actually expired.
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API routes authenticate themselves (and webhooks have no session) — skip.
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Local JWT verification + auto-refresh of expired sessions.
  const { data } = await supabase.auth.getClaims()
  const authenticated = !!data?.claims

  const isAuthPage = pathname.startsWith('/login')

  if (!authenticated && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (authenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return supabaseResponse
}

export const config = {
  // Skip static assets entirely — running the guard there is pure overhead.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)'],
}
