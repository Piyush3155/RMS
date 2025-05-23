import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const tableNumber = url.searchParams.get("table")

  if (!tableNumber) {
    return NextResponse.json({ error: "Table number is required" }, { status: 400 })
  }

  try {
    console.log(`Fetching orders for table ${tableNumber}`)

    // First check if any orders exist for this table
    const orderCount = await prisma.order2.count({
      where: {
        tableNumber: Number.parseInt(tableNumber),
      },
    })

    console.log(`Found ${orderCount} total orders for table ${tableNumber}`)

    // Fetch the most recent orders for this table
    const recentOrders = await prisma.order2.findMany({
      where: {
        tableNumber: Number.parseInt(tableNumber),
        status: {
          notIn: ["cancelled"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Limit to 10 most recent orders
    })

    console.log(`Found ${recentOrders.length} non-cancelled orders for table ${tableNumber}`)

    // Log the first order to see its structure
    if (recentOrders.length > 0) {
      console.log("Sample order:", JSON.stringify(recentOrders[0], null, 2))
    }

    // Process each order to extract and parse items
    const processedOrders = recentOrders.map((order) => {
      let parsedItems = []

      try {
        const data = JSON.parse(order.items)
        console.log(`Successfully parsed items for order ${order.id}:`, data)
        parsedItems = Array.isArray(data)
          ? data.map((item) => ({
              name: item.itemName || item.name || "Unknown Item",
              price: item.price || 0,
              quantity: item.quantity || 1,
            }))
          : [{ name: String(order.items), price: 0, quantity: 1 }]
      } catch (error) {
        console.error(`Error parsing items for order ${order.id}:`, error)
        parsedItems = [{ name: String(order.items || "Unknown Item"), price: 0, quantity: 1 }]
      }

      return {
        id: order.id,
        orderId: order.orderId,
        tableNumber: order.tableNumber,
        status: order.status,
        price: order.price,
        createdAt: order.createdAt,
        items: parsedItems,
        itemCount: parsedItems.length,
      }
    })

    // Calculate total spent
    const totalSpent = recentOrders.reduce((total, order) => total + order.price, 0)

    return NextResponse.json({
      orders: processedOrders,
      totalSpent,
    })
  } catch (error) {
    console.error("Error fetching customer orders:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to fetch customer orders" }, { status: 500 })
  } finally {
    await prisma.$disconnect().catch((e) => {
      console.error("Error disconnecting from Prisma:", e instanceof Error ? e.message : "Unknown error")
    })
  }
}
