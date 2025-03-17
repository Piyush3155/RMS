import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const username = req.cookies.get("username")?.value; // Get username from cookies

  // Public pages that don't require authentication
  const publicRoutes = ["/login", "/register", "/"];

  // Allow access to public pages
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // If the user is NOT logged in, redirect to login page
  if (!username) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

// Apply middleware to protected routes only
export const config = {
  matcher: ["/user/:path*", "/admin/:path*", "/dash/:path*"],
};
