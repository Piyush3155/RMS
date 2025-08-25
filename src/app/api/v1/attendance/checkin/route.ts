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

    // Check if staff member exists and is active
    const staff = await prisma.staff.findUnique({ where: { id: staffId } })
    if (!staff) {
      return NextResponse.json({ message: "Staff member not found" }, { status: 404 })
    }
    if (staff.status !== "Active") {
      return NextResponse.json({ message: "Only active staff can check in" }, { status: 400 })
    }

    const now = new Date()
    const todayDate = startOfDay(now)

    // Find today's attendance record by exact date
    let attendance = await prisma.staffAttendance.findFirst({
      where: {
        staffId,
        date: todayDate,
      },
    })

    if (attendance) {
      if (attendance.checkIn && !attendance.checkOut) {
        return NextResponse.json({ message: "Already checked in today", attendance }, { status: 400 })
      }
      if (attendance.checkIn && attendance.checkOut) {
        return NextResponse.json({ message: "Attendance already completed for today", attendance }, { status: 400 })
      }
      // Defensive: update checkIn if not set
      const updated = await prisma.staffAttendance.update({
        where: { id: attendance.id },
        data: { checkIn: now, status: "Present" },
      })
      return NextResponse.json({ message: "Checked in successfully", attendance: updated })
    }

    // Create new attendance record for today (date at 00:00:00)
    attendance = await prisma.staffAttendance.create({
      data: {
        staffId,
        date: todayDate,
        checkIn: now,
        status: "Present",
      },
    })

    return NextResponse.json({ message: "Checked in successfully", attendance })
  } catch (error) {
    console.error("Error checking in:", error)
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 })
  }
}
    