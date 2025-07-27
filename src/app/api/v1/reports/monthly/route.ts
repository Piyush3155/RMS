// For App Router (app/api/reports/monthly/route.ts)

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma" // Adjust path based on your project

export async function GET() {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const end = new Date()
  end.setMonth(end.getMonth() + 1)
  end.setDate(0)
  end.setHours(23, 59, 59, 999)

  const reportData = await prisma.orderanalytics.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return NextResponse.json(reportData)
}
