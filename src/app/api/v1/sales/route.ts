import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function generateMockSalesData() {
  const mockData = [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 0; i < 7; i++) {
    mockData.push({
      day: days[i],
      sales: Math.floor(Math.random() * 1000),
    });
  }
  return mockData;
}

export async function GET() {
  try {
    // Get current date (start of day and end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get order analytics
    const orderAnalytics = await prisma.orderanalytics.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Today's sales
    const todaySales = await prisma.orderanalytics.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: {
          gte: today,
          lte: endOfDay,
        },
      },
    });

    // Total sales (all time)
    const totalSales = await prisma.orderanalytics.aggregate({
      _sum: { totalAmount: true },
    });

    // Monthly sales (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlySales = await prisma.orderanalytics.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfDay,
        },
      },
    });

    // Total items sold in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // includes today
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const itemsSoldLast7Days = await prisma.orderanalytics.aggregate({
      _sum: { totalItemsSold: true },
      where: {
        createdAt: {
          gte: sevenDaysAgo,
          lte: endOfDay,
        },
      },
    });

    // Top selling items
    const topSellingItems = await prisma.orderanalytics.groupBy({
      by: ["topItemName"],
      _sum: { topItemCount: true },
      orderBy: {
        _sum: {
          topItemCount: "desc",
        },
      },
      take: 5,
    });

    // Sales by date (last 7 days)
    const salesByDateRaw = await prisma.orderanalytics.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const groupedSales = salesByDateRaw.reduce((acc, record) => {
      const date = new Date(record.createdAt).toLocaleDateString("en-IN", {
        weekday: "short",
        timeZone: "Asia/Kolkata",
      });

      if (!acc[date]) acc[date] = 0;
      acc[date] += record.totalAmount || 0;

      return acc;
    }, {} as Record<string, number>);

    const dailySalesData = Object.entries(groupedSales).map(([day, sales]) => ({
      day,
      sales,
    }));

    // Recent orders
    const recentOrders = await prisma.orderanalytics.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      orderAnalytics,
      totalSales: totalSales._sum.totalAmount || 0,
      todaySales: todaySales._sum.totalAmount || 0,
      monthlySales: monthlySales._sum.totalAmount || 0,
      totalItemsSold: itemsSoldLast7Days._sum.totalItemsSold || 0,
      topSellingItems,
      dailySalesData: dailySalesData.length > 0 ? dailySalesData : generateMockSalesData(),
      recentOrders,
    });
  } catch (error) {
    console.error("Error analyzing sales data:", error);
    return NextResponse.json({ error: "Failed to analyze sales data" }, { status: 500 });
  }
}
