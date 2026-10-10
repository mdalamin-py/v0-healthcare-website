import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Refreshes the Supabase session on authenticated routes and redirects
// signed-out visitors to the right sign-in page. Authorization is enforced
// again on the server and in the database (row level security).
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const isAdmin = pathname.startsWith("/admin")
  const loginPath = isAdmin ? "/admin/login" : "/account/login"
  const isLogin = pathname === loginPath
  const isProtected = (isAdmin || pathname.startsWith("/account") || pathname.startsWith("/doctor-portal")) && !isLogin

  const redirectToLogin = () => {
    const url = new URL(loginPath, request.url)
    if (!isAdmin) url.searchParams.set("next", `${pathname}${search}`)
    return NextResponse.redirect(url)
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return isProtected ? redirectToLogin() : NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && isProtected) return redirectToLogin()

  return response
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/doctor-portal/:path*", "/appointments/book"],
}
