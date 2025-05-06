import { PrismaClient } from "@prisma/client"
import { type NextRequest, NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { table, items, price } = await req.json()

    const tableNumber = Number.parseInt(table)
    const totalPrice = Number.parseFloat(price)

    if (!Array.isArray(items) || isNaN(tableNumber) || isNaN(totalPrice)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Check if there's an existing order for this table with status "pending"
    const existingOrder = await prisma.order2.findFirst({
      where: {
        tableNumber,
        status: "pending",
      },
    })

    await prisma.kitchendashboard.create({
      data: {
        tableNumber,
        items: JSON.stringify(items),
        status: "pending",
      },
    })
    const result = await prisma.$transaction(async (prisma) => {
      let order

      if (existingOrder) {
        // If order exists, parse existing items and merge with new items
        const existingItems = JSON.parse(existingOrder.items)
        const updatedItems = mergeOrderItems(existingItems, items)

        // Update the existing order
        order = await prisma.order2.update({
          where: { id: existingOrder.id },
          data: {
            items: JSON.stringify(updatedItems),
            price: existingOrder.price + totalPrice,
          },
        })

        // Update kitchen dashboard entry

      } else {
        // Create new order if no existing order found
        order = await prisma.order2.create({
          data: {
            tableNumber,
            items: JSON.stringify(items),
            status: "pending",
            price: totalPrice,
          },
        })

      }

      // Use original items for analytics
      const totalAmount = items.reduce(
        (acc: number, item: { price: number; quantity: number }) => acc + item.price * item.quantity,
        0,
      )

      const totalItemsSold = items.reduce((acc: number, item: { quantity: number }) => acc + item.quantity, 0)

      // Find top-selling item
      const itemFrequency: Record<string, number> = {}
      for (const item of items) {
        itemFrequency[item.itemName] = (itemFrequency[item.itemName] || 0) + item.quantity
      }

      const [topItemName, topItemCount] = Object.entries(itemFrequency).sort((a, b) => b[1] - a[1])[0] || ["N/A", 0]

      // Create or update OrderAnalytics entry
      if (existingOrder) {
        // Update existing analytics
        const existingAnalytics = await prisma.orderanalytics.findFirst({
          where: { orderId: existingOrder.id },
        })

        if (existingAnalytics) {
          await prisma.orderanalytics.update({
            where: { id: existingAnalytics.id },
            data: {
              totalAmount: existingAnalytics.totalAmount + totalAmount,
              totalItemsSold: existingAnalytics.totalItemsSold + totalItemsSold,
              // We'll keep the existing top item for simplicity
            },
          })
        }
      } else {
        // Create new analytics for new order
        await prisma.orderanalytics.create({
          data: {
            orderId: order.id,
            totalAmount,
            totalItemsSold,
            topItemName,
            topItemCount,
          },
        })
      }

      // Insert into fetchorder
      await prisma.fetchorder.createMany({
        data: items.map((item: { itemName: string; quantity: number; price: number }) => ({
          tableNumber,
          items: item.itemName,
          itemName: JSON.stringify(item.itemName),
          quantity: item.quantity,
          price: item.price,
          status: "pending",
          orderId: order.id,
        })),
      })

      return {
        message: existingOrder ? "Order updated" : "New order created",
        order,
        isUpdate: !!existingOrder,
      }
    })

    return NextResponse.json({ success: true, result }, { status: 200 })
  } catch (error) {
    console.error("POST /api/v1/order error:", error)
    return NextResponse.json({ error: "Database error!" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// Helper function to merge order items
interface OrderItem {
  itemName: string
  quantity: number
}

function mergeOrderItems(existingItems: OrderItem[], newItems: OrderItem[]): OrderItem[] {
  const mergedItems: OrderItem[] = [...existingItems]

  // Create a map of existing items by itemName for quick lookup
  const existingItemMap = new Map(existingItems.map((item) => [item.itemName, item]))

  // Process each new item
  for (const newItem of newItems) {
    if (existingItemMap.has(newItem.itemName)) {
      // If item exists, update quantity
      const existingItem = existingItemMap.get(newItem.itemName)
      const existingIndex = mergedItems.findIndex((item) => item.itemName === newItem.itemName)

      if (existingItem) {
        mergedItems[existingIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + newItem.quantity,
        }
      }
    } else {
      // If item doesn't exist, add it to the array
      mergedItems.push(newItem)
    }
  }

  return mergedItems
}
