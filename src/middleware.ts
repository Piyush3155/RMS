import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const username = req.cookies.get("username")?.value
  const role = req.cookies.get("role")?.value?.toLowerCase()

  const normalizedPath = pathname.replace(/\/$/, "")
  const publicRoutes = ["/login", "/"]

  if (publicRoutes.includes(normalizedPath)) return NextResponse.next()
  if (!username || !role) return NextResponse.redirect(new URL("/login", req.url))

  if (normalizedPath.startsWith("/") && role !== "manager") {
    return NextResponse.redirect(new URL("/kitchen?error=access-denied", req.url))
  }

  if (normalizedPath.startsWith("/kitchen") && !["manager", "chef", "waiter"].includes(role)) {
    return NextResponse.redirect(new URL("/login?error=access-denied", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["//:path*", "/kitchen/:path*"],
}
