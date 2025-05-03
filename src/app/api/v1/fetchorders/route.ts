import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const orders = await prisma.fetchorder.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    // Format the orders to include parsed itemName if it's a JSON string
    const formattedOrders = orders.map((order) => {
      try {
        // Try to parse itemName as JSON if it exists
        const parsedItemName = order.itemName ? JSON.parse(order.itemName) : null

        return {
          ...order,
          // If parsing succeeded, use the parsed object, otherwise keep the original
          itemName: parsedItemName || order.itemName,
          // Calculate total items from the items field
          items: order.items ? [{ itemName: `${order.items} (${order.quantity || 1})` }] : [],
        }
      } catch {
        // If parsing fails, return the original order
        return {
          ...order,
          items: order.items ? [{ itemName: `${order.items} (${order.quantity || 1})` }] : [],
        }
      }
    })

    return NextResponse.json(formattedOrders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
