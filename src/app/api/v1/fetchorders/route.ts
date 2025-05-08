import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const orders = await prisma.order2.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    // Group orders by tableNumber
    const groupedOrders: Record<
      number,
      {
        tableNumber: number
        orders: typeof orders
        items: Array<{
          name: string
          price: number
          quantity: number
        }>
        totalPrice: number
        orderIds: number[] // New array to store all orderIds for a table
      }
    > = {}

    for (const order of orders) {
      const tableNo = order.tableNumber
      const parsedItems = (() => {
        try {
          const data = JSON.parse(order.items)
          // Ensure each item has the required properties
          return Array.isArray(data)
            ? data.map((item) => ({
                name: item.itemName || item.name || "Unknown Item",
                price: item.price || 0,
                quantity: item.quantity || 1,
              }))
            : [{ name: order.items, price: 0, quantity: 1 }]
        } catch {
          return [{ name: order.items, price: 0, quantity: 1 }]
        }
      })()

      if (!groupedOrders[tableNo]) {
        groupedOrders[tableNo] = {
          tableNumber: tableNo,
          orders: [],
          items: [],
          totalPrice: 0,
          orderIds: [],  // Initialize orderIds array
        }
      }

      groupedOrders[tableNo].orders.push(order)
      groupedOrders[tableNo].items.push(...parsedItems)
      groupedOrders[tableNo].totalPrice += order.price
      if (order.orderId !== null) {
        groupedOrders[tableNo].orderIds.push(order.orderId) // Add orderId to the list
      }
    }

    // Convert to array of grouped objects
    const formattedOrders = Object.values(groupedOrders)

    return NextResponse.json(formattedOrders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
