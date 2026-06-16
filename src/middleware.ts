import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const isDashboardRoute = !request.nextUrl.pathname.startsWith('/login') && 
                           !request.nextUrl.pathname.startsWith('/_next') && 
                           !request.nextUrl.pathname.startsWith('/api') &&
                           !request.nextUrl.pathname.includes('.'); // Skip static files

  if (!isDashboardRoute) {
    return NextResponse.next()
  }

  // 1. Check Master Admin Cookie
  const adminCookie = request.cookies.get('rolyang_admin_session')
  if (adminCookie?.value === 'true') {
    // If admin tries to go to /apply or /profile, redirect to dashboard home
    if (request.nextUrl.pathname === '/apply' || request.nextUrl.pathname === '/profile') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // 2. Refresh Supabase Session & Check Auth
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Retrieve user role (defaulting to listener)
  const role = user.user_metadata?.role || 'listener'

  // Restrict Admin-only routes
  const adminOnlyRoutes = ['/moderation', '/users', '/banners', '/artists', '/genres'];
  const isTargetingAdminRoute = adminOnlyRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  );

  if (isTargetingAdminRoute && role !== 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Restrict Artist/Admin-only routes
  const artistRoutes = ['/upload', '/analytics'];
  const isTargetingArtistRoute = artistRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  );

  if (isTargetingArtistRoute && role !== 'admin' && role !== 'artist') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // If role is admin, block access to /profile
  if (request.nextUrl.pathname === '/profile' && role === 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // If path is '/apply', allow listeners to apply
  if (request.nextUrl.pathname === '/apply') {
    if (role === 'listener') {
      return response;
    }
    // If they already have a role, redirect to dashboard home
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // If they are a regular listener, redirect to /apply
  if (role === 'listener') {
    const url = request.nextUrl.clone()
    url.pathname = '/apply'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
