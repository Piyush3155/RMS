import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    // Clear authentication cookies
    (await cookies()).delete("auth_token");
    (await cookies()).delete("username")
    
    return NextResponse.json({ 
      success: true, 
      message: "Logged out successfully" 
    })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Failed to logout" 
    }, { status: 500 })
  }
}
