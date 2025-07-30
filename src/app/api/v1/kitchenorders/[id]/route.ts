import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Allowed order statuses (updated to include 'served')
const allowedStatuses = ["pending", "preparing", "completed", "served"]

// PUT /api/v1/kitchenorders/[id]
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await context.params

  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
  }

  const id = Number(orderId)
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
  }

  try {
    const body = await req.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    console.log("Updating order with ID:", id, "to status:", status)

    const updatedOrder = await prisma.kitchendashboard.update({
      where: { id },
      data: { status },
    })

    // If status is 'served', schedule automatic deletion after 1 minute
    if (status === "served") {
      console.log(`Order ${id} marked as served. Will be deleted in 1 minute.`)

      // Schedule deletion after 1 minute (60000 milliseconds)
      setTimeout(async () => {
        try {
          console.log(`Auto-deleting served order with ID: ${id}`)
          await prisma.kitchendashboard.delete({
            where: { id },
          })
          console.log(`Order ${id} automatically deleted after being served.`)
        } catch (error) {
          console.error(`Failed to auto-delete order ${id}:`, error)
        }
      }, 30000) // 1 minute = 60000 milliseconds
    }

    return NextResponse.json({ message: "Order status updated", kitchenOrder: updatedOrder }, { status: 200 })
  } catch (error) {
    console.error("Error updating order status:", error)
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
}

// DELETE /api/v1/kitchenorders/[id]
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await context.params

  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
  }

  const id = Number(orderId)
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
  }

  try {
    console.log(`Deleting order with ID: ${id}`)

    await prisma.kitchendashboard.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Order deleted successfully" })
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 })
  }
}
