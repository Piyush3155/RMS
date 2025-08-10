import { NextRequest, NextResponse } from "next/server"
// import Twilio SDK
import twilio from "twilio"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_FROM_NUMBER // your Twilio number

const client = twilio(accountSid, authToken)

export async function POST(req: NextRequest) {
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
