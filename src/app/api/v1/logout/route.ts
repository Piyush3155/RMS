import { NextResponse } from "next/server";
import { serialize } from "cookie";

export async function GET() {
  const response = NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"));

  response.headers.set(
    "Set-Cookie",
    serialize("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0), // Expire cookie
      path: "/",
    })
  );

  return response;
}
