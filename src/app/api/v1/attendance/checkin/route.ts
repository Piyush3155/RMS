import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { startOfDay, endOfDay } from "date-fns"

export async function POST(req: Request) {
  try {
    const { staffId } = await req.json()

    if (!staffId) {
      return NextResponse.json({ message: "Staff ID is required" }, { status: 400 })
    }

    const today = new Date()

    // Check if staff member exists
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    })

    if (!staff) {
      return NextResponse.json({ message: "Staff member not found" }, { status: 404 })
    }

    // Check if already checked in today
    const existing = await prisma.staffAttendance.findFirst({
      where: {
        staffId,
        date: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
    })

    if (existing) {
      return NextResponse.json({ message: "Already checked in today" }, { status: 400 })
    }

    // Create check-in record
    const attendance = await prisma.staffAttendance.create({
      data: {
        staffId,
        date: today,
        checkIn: new Date(),
        status: "Present",
      },
    })

    return NextResponse.json({
      message: "Checked in successfully",
      attendance,
    })
  } catch (error) {
    console.error("Error checking in:", error)
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 })
  }
}
