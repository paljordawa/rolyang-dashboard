import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isAdminPath = !request.nextUrl.pathname.startsWith('/login') && 
                      !request.nextUrl.pathname.startsWith('/_next') && 
                      !request.nextUrl.pathname.startsWith('/api') &&
                      !request.nextUrl.pathname.includes('.'); // Skip static files

  if (isAdminPath) {
    const sessionCookie = request.cookies.get('rolyang_admin_session')
    
    if (!sessionCookie || sessionCookie.value !== 'true') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
