import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Delete the order from the database
    await prisma.fetchorder.delete({
      where: {
        id: Number.parseInt(id),
      },
    })

    return NextResponse.json({ success: true, message: "Order deleted successfully" })
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
