import { NextRequest, NextResponse } from "next/server"
// import Twilio SDK
import twilio from "twilio"

export async function POST(req: NextRequest) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_FROM_NUMBER // your Twilio number

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json({ error: "Twilio configuration is missing." }, { status: 500 })
  }

  const client = twilio(accountSid, authToken)

  const { contactNo, message } = await req.json()
  if (!contactNo || !message) {
    return NextResponse.json({ error: "Contact number and message required" }, { status: 400 })
  }
  try {
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: "+91" + contactNo // India country code
    })
    return NextResponse.json({ success: true, sid: result.sid })
  } catch  {
  }
}
