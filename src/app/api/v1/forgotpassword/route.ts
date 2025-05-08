import { NextResponse } from "next/server"
import { sendMail } from "@/lib/mail"

const users = [
  { name: "Piyush", email: "piyushgurav176@gmail.com", password: "piyush123" },
  { name: "Srinidhi", email: "srinidhikittur@gmail.com", password: "srinidhi123" },
  { name: "Sanika", email: "sanikavandure@gmail.com", password: "sanika123" },
]

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())

    if (!user) {
      return NextResponse.json({ error: "No account found with this email address" }, { status: 404 })
    }

    await sendMail({
      to: user.email,
      subject: "Your Password from Bites & Co",
      text: `Hello ${user.name},\n\nYour password is: ${user.password}\n\nPlease keep it safe.`,
    })

    return NextResponse.json({ success: true, message: "Password has been sent to your email address" })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Email sending failed" }, { status: 500 })
  }
}
