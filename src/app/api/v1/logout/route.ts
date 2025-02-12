import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 })

    // Clear the session cookie
    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error("Error logging out:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

