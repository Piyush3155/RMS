import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const now = new Date()

    const daily = await prisma.orderanalytics.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: {
          gte: new Date(now.setHours(0, 0, 0, 0)),
          lt: new Date(now.setHours(23, 59, 59, 999)),
        },
      },
    })

    const startOfWeek = new Date()
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    const weekly = await prisma.orderanalytics.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: {
          gte: startOfWeek,
          lt: endOfWeek,
        },
      },
    })

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const monthly = await prisma.orderanalytics.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
    })

    return NextResponse.json({
      dailyTotal: daily._sum.totalAmount || 0,
      weeklyTotal: weekly._sum.totalAmount || 0,
      monthlyTotal: monthly._sum.totalAmount || 0,
    })
  } catch (error) {
    console.error("Error fetching totals:", error)
    return NextResponse.json({ error: "Failed to fetch totals" }, { status: 500 })
  }
}
