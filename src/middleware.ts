import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const username = req.cookies.get("username")?.value;

  const normalizedPath = pathname.replace(/\/$/, "");
  const publicRoutes = ["/login", "/"];

  if (publicRoutes.includes(normalizedPath)) {
    return NextResponse.next();
  }

  if (!username) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/user/:path*", "/dash/:path*", "/manager/:path*", "/admin/:path*"],
};
