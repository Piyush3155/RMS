import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get order analytics
    const orderAnalytics = await prisma.orderanalytics.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    })

    // Get total sales amount
    const totalSales = await prisma.orderanalytics.aggregate({
      _sum: {
        totalAmount: true,
      },
    })

    // Get total items sold
    const totalItemsSold = await prisma.orderanalytics.aggregate({
      _sum: {
        totalItemsSold: true,
      },
    })

    // Get top selling items
    const topSellingItems = await prisma.orderanalytics.groupBy({
      by: ["topItemName"],
      _sum: {
        topItemCount: true,
      },
      orderBy: {
        _sum: {
          topItemCount: "desc",
        },
      },
      take: 5,
    })

    // Get sales by date (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const salesByDate = await prisma.orderanalytics.groupBy({
      by: ["createdAt"],
      _sum: {
        totalAmount: true,
      },
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Format sales by date for chart
    const dailySalesData = salesByDate.map((item) => ({
      day: new Date(item.createdAt).toLocaleDateString("en-IN", {
        weekday: "short",
        timeZone: "Asia/Kolkata",
      }),
      sales: item._sum.totalAmount || 0,
    }));
    
    // Get recent orders
    const recentOrders = await prisma.fetchorder.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    })

    return NextResponse.json({
      orderAnalytics,
      totalSales: totalSales._sum.totalAmount || 0,
      totalItemsSold: totalItemsSold._sum.totalItemsSold || 0,
      topSellingItems,
      dailySalesData: dailySalesData.length > 0 ? dailySalesData : generateMockSalesData(),
      recentOrders,
    })
  } catch (error) {
    console.error("Error analyzing sales data:", error)
    return NextResponse.json({ error: "Failed to analyze sales data" }, { status: 500 })
  }
}

// Generate mock sales data if no real data is available
function generateMockSalesData() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  return days.map((day) => ({
    day,
    sales: Math.floor(Math.random() * 3000) + 1000,
  }))
}
