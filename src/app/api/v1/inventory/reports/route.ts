import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")

    if (type === "summary") {
      // Stock summary: all items with current quantity and reorder level
      const items = await prisma.inventoryItem.findMany({
        select: {
          id: true,
          name: true,
          category: true,
          unit: true,
          quantity: true,
          reorderLevel: true,
          maxCapacity: true,
          supplier: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      })
      return NextResponse.json({ summary: items })
    }

    if (type === "consumption") {
      // Daily/Monthly Stock Consumption (last 30 days)
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const consumption = await prisma.stockInOut.findMany({
        where: {
          type: "out",
          date: { gte: since },
        },
        select: {
          date: true,
          inventoryItem: { select: { name: true, unit: true } },
          quantity: true,
        },
        orderBy: { date: "desc" },
      })
      return NextResponse.json({ consumption })
    }

    if (type === "wastage") {
      // Wastage Report (last 30 days)
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const wastages = await prisma.wastage.findMany({
        where: { date: { gte: since } },
        select: {
          date: true,
          inventoryItem: { select: { name: true, unit: true } },
          quantity: true,
          reason: true,
          note: true,
        },
        orderBy: { date: "desc" },
      })
      return NextResponse.json({ wastages })
    }

    if (type === "purchase") {
      // Purchase History (last 30 days)
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const purchases = await prisma.stockInOut.findMany({
        where: {
          type: "in",
          date: { gte: since },
        },
        select: {
          date: true,
          inventoryItem: { select: { name: true, unit: true } },
          quantity: true,
          price: true,
          supplier: { select: { name: true } },
          note: true,
        },
        orderBy: { date: "desc" },
      })
      return NextResponse.json({ purchases })
    }

    if (type === "ingredient-usage") {
      // Ingredient-wise Usage Report (last 30 days)
      const since = new Date()
      since.setDate(since.getDate() - 30)
      // Aggregate total "out" quantity per ingredient
      const usage = await prisma.stockInOut.groupBy({
        by: ["inventoryItemId"],
        where: {
          type: "out",
          date: { gte: since },
        },
        _sum: { quantity: true },
      })
      // Join with item names
      const items = await prisma.inventoryItem.findMany({
        where: { id: { in: usage.map(u => u.inventoryItemId) } },
        select: { id: true, name: true, unit: true },
      })
      const usageReport = usage.map(u => ({
        inventoryItemId: u.inventoryItemId,
        name: items.find(i => i.id === u.inventoryItemId)?.name || "",
        unit: items.find(i => i.id === u.inventoryItemId)?.unit || "",
        totalUsed: u._sum.quantity || 0,
      }))
      return NextResponse.json({ usage: usageReport })
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
  } catch (error) {
    console.error("GET /api/v1/inventory/reports error:", String(error))
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    )
  }
}
