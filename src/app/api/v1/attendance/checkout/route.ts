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

    // Find today's attendance record
    const record = await prisma.staffAttendance.findFirst({
      where: {
        staffId,
        date: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
    })

    if (!record) {
      return NextResponse.json({ message: "No check-in record found for today" }, { status: 400 })
    }

    if (record.checkOut) {
      return NextResponse.json({ message: "Already checked out today" }, { status: 400 })
    }

    // Update with check-out time
    const updatedAttendance = await prisma.staffAttendance.update({
      where: { id: record.id },
      data: { checkOut: new Date() },
    })

    return NextResponse.json({
      message: "Checked out successfully",
      attendance: updatedAttendance,
    })
  } catch (error) {
    console.error("Error checking out:", error)
    return NextResponse.json({ error: "Failed to check out" }, { status: 500 })
  }
}
