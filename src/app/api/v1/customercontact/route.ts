import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { contactNo, email } = await req.json()
    if (!contactNo && !email) {
      return NextResponse.json({ error: "Contact number or email required" }, { status: 400 })
    }

    // Create or update contact (avoid duplicates)
    const contact = await prisma.customerContact.upsert({
      where: {
        contactNo: contactNo ?? undefined,
        email: email ?? undefined,
      },
      update: {},
      create: {
        contactNo,
        email,
      },
    })

    return NextResponse.json({ success: true, contact })
  } catch (error) {
    console.log("Error occurred while processing request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const contacts = await prisma.customerContact.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ contacts })
  } catch {
    return NextResponse.json({ contacts: [] }, { status: 500 })
  }
}
