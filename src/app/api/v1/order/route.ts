import { PrismaClient } from "@prisma/client"
import { type NextRequest, NextResponse } from "next/server"
import { generateUniqueNumericOrderId } from "@/utils/generate-id"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { table, items, price } = await req.json()

    const tableNumber = Number.parseInt(table)
    const totalPrice = Number.parseFloat(price)

    if (!Array.isArray(items) || isNaN(tableNumber) || isNaN(totalPrice)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Generate a unique 6-digit numeric order ID
    const numericOrderId = await generateUniqueNumericOrderId(prisma)

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
        orderId: numericOrderId, // Add the generated numeric order ID
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
            orderId: numericOrderId, // Update with the new order ID
          },
        })
      } else {
        // Create new order if no existing order found
        order = await prisma.order2.create({
          data: {
            tableNumber,
            items: JSON.stringify(items),
            status: "pending",
            price: totalPrice,
            orderId: numericOrderId, // Add the generated numeric order ID
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
              numericOrderId: numericOrderId, // Add the numeric order ID
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
            numericOrderId: numericOrderId, // Add the numeric order ID
          },
        })
      }

      // Insert into fetchorder
     

      return {
        message: existingOrder ? "Order updated" : "New order created",
        order,
        isUpdate: !!existingOrder,
        orderId: numericOrderId, // Include the numeric order ID in the response
      }
    })

    return NextResponse.json(
      {
        success: true,
        result,
        orderId: numericOrderId, // Include the order ID in the top-level response
      },
      { status: 200 },
    )
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