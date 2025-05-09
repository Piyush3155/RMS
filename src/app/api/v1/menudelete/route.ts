import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// DELETE menu item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Menu ID is required" }, { status: 400 })
    }

    await prisma.menu.delete({
      where: {
        id: Number.parseInt(id),
      },
    })

    return NextResponse.json({ success: true, message: "Menu item deleted successfully" })
  } catch (error) {
    console.error("Error deleting menu item:", error)
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// PUT menu item (edit)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Menu ID is required" }, { status: 400 })
    }

    const body = await request.json()

    const updatedItem = await prisma.menu.update({
      where: {
        id: Number.parseInt(id),
      },
      data: {
        itemName: body.itemName,
        description: body.description,
        price: body.price,
        category: body.category,
        isVeg:body.isVeg
        // Add other fields you allow to update here
      },
    })

    return NextResponse.json({ success: true, message: "Menu item updated", item: updatedItem })
  } catch (error) {
    console.error("Error updating menu item:", error)
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
