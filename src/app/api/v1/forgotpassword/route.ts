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
      subject: "Your Password from Team Piyush Gurav",
      text: `Hello ${user.name},

Welcome aboard! 🎉

We’re excited to have you as part of the BITE & CO team.

Your login credentials have been assigned by the developer:

🔒 Password: ${user.password}

Please remember this password and keep it stored securely. If you ever need to change it, please contact the developer directly.

If you need any assistance, feel free to reach out.

Best regards,  
Team Piyush Gurav`,
    })

    return NextResponse.json({ success: true, message: "Password has been sent to your email address" })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Email sending failed" }, { status: 500 })
  }
}
