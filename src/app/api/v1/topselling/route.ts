import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Step 1: Group by topItemName to get total sold quantity and total revenue
    const aggregatedItems = await prisma.orderanalytics.groupBy({
      by: ['topItemName'],
      _sum: {
        topItemCount: true,
        totalAmount: true,
      },
      orderBy: {
        _sum: {
          topItemCount: 'desc',
        },
      },
      take: 5,
    })

    // Step 2: Format the data
    const items = aggregatedItems.map((item) => ({
      name: item.topItemName,
      sold: item._sum.topItemCount || 0,
      revenue: item._sum.totalAmount || 0,
    }))

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Error fetching top selling items:", error)
    return NextResponse.json({ error: "Failed to fetch top selling items" }, { status: 500 })
  }
}
