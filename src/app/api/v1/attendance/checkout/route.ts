import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { startOfDay } from "date-fns"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const staffId = Number(body?.staffId)

    if (!staffId || !Number.isInteger(staffId)) {
      return NextResponse.json({ message: "Valid staffId is required" }, { status: 400 })
    }

    const now = new Date()
    const todayDate = startOfDay(now)

    // Find today's attendance record by exact date
    const attendance = await prisma.staffAttendance.findFirst({
      where: {
        staffId,
        date: todayDate,
      },
    })

    if (!attendance) {
      return NextResponse.json({ message: "No check-in record found for today" }, { status: 400 })
    }
    if (!attendance.checkIn) {
      return NextResponse.json({ message: "Cannot check out before checking in" }, { status: 400 })
    }
    if (attendance.checkOut) {
      return NextResponse.json({ message: "Already checked out today", attendance }, { status: 400 })
    }

    const checkOutTime = now
    // Compute worked hours
    let workedHours = "-"
    if (attendance.checkIn) {
      const inDate = new Date(attendance.checkIn)
      workedHours = ((checkOutTime.getTime() - inDate.getTime()) / (1000 * 60 * 60)).toFixed(2)
    }
    // Adjust status based on worked hours
    const hoursNum = workedHours === "-" ? 0 : Number(workedHours)
    const newStatus = hoursNum > 0 && hoursNum < 4 ? "Half Day" : "Present"

    const updated = await prisma.staffAttendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: checkOutTime,
        status: newStatus,
      },
    })

    return NextResponse.json({
      message: "Checked out successfully",
      attendance: updated,
      workedHours: workedHours === "-" ? null : Number(workedHours),
    })
  } catch (error) {
    console.error("Error checking out:", error)
    return NextResponse.json({ error: "Failed to check out" }, { status: 500 })
  }
}