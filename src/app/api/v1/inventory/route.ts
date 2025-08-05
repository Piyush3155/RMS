import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")

    if (type === "suppliers") {
      const suppliers = await prisma.supplier.findMany({
        orderBy: { name: "asc" },
      })
      return NextResponse.json({ suppliers })
    }

    if (type === "transactions") {
      // Fetch recent 20 transactions with item and supplier info
      const transactions = await prisma.stockInOut.findMany({
        orderBy: { date: "desc" },
        take: 20,
        include: {
          inventoryItem: { select: { name: true } },
          supplier: { select: { name: true } },
        },
      })
      return NextResponse.json({ transactions })
    }

    // Get all inventory items with variants and supplier
    const items = await prisma.inventoryItem.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        unit: true,
        sku: true,
        quantity: true,
        reorderLevel: true,
        maxCapacity: true,
        supplierId: true,
        supplier: {
          select: {
            id: true,
            name: true,
            contact: true,
            email: true,
            phone: true,
          },
        },
        variants: {
          select: {
            id: true,
            size: true,
            quantity: true,
          },
        },
        // Exclude datetime fields that might be problematic
        // createdAt: true,
        // updatedAt: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error("GET /api/v1/inventory error:", String(error))

    // If it's a datetime error, try to fix it
    if (
      String(error).includes("datetime") ||
      String(error).includes("updatedAt") ||
      String(error).includes("createdAt")
    ) {
      try {
        console.log("Attempting to fix datetime issues...")

        // Fix invalid datetime values using raw SQL
        await prisma.$executeRaw`
          UPDATE InventoryItem 
          SET updatedAt = NOW() 
          WHERE updatedAt = '0000-00-00 00:00:00' 
             OR updatedAt IS NULL 
             OR updatedAt < '1970-01-01 00:00:00'
        `

        await prisma.$executeRaw`
          UPDATE InventoryItem 
          SET createdAt = NOW() 
          WHERE createdAt = '0000-00-00 00:00:00' 
             OR createdAt IS NULL 
             OR createdAt < '1970-01-01 00:00:00'
        `

        // Retry the query without datetime fields first
        const items = await prisma.inventoryItem.findMany({
          select: {
            id: true,
            name: true,
            category: true,
            unit: true,
            sku: true,
            quantity: true,
            reorderLevel: true,
            maxCapacity: true,
            supplierId: true,
            supplier: {
              select: {
                id: true,
                name: true,
                contact: true,
                email: true,
                phone: true,
              },
            },
            variants: {
              select: {
                id: true,
                size: true,
                quantity: true,
              },
            },
          },
          orderBy: { name: "asc" },
        })

        console.log("Successfully fixed datetime issues and retrieved items")
        return NextResponse.json({ items })
      } catch (retryError) {
        console.error("Retry failed:", String(retryError))
        return NextResponse.json(
          {
            error: "Database datetime error - please run database cleanup",
            details: String(retryError),
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: String(error),
      },
      { status: 500 },
    )
  }
}

type VariantInput = {
  size: string
  quantity: number
}

export async function POST(req: NextRequest) {
  try {
    // Fix invalid datetime values before any queries
    await prisma.$executeRaw`
      UPDATE InventoryItem 
      SET updatedAt = NOW() 
      WHERE updatedAt = '0000-00-00 00:00:00' 
         OR updatedAt IS NULL 
         OR updatedAt < '1970-01-01 00:00:00'
    `
    await prisma.$executeRaw`
      UPDATE InventoryItem 
      SET createdAt = NOW() 
      WHERE createdAt = '0000-00-00 00:00:00' 
         OR createdAt IS NULL 
         OR createdAt < '1970-01-01 00:00:00'
    `

    const body = await req.json()
    const { action } = body

    // Add Inventory Item
    if (action === "addItem") {
      const { name, category, unit, sku, quantity, reorderLevel, maxCapacity, supplierId, variants } = body

      // Check if SKU already exists
      const existingSku = await prisma.inventoryItem.findUnique({
        where: { sku },
      })

      if (existingSku) {
        return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
      }

      const now = new Date()
      const item = await prisma.inventoryItem.create({
        data: {
          name,
          category,
          unit,
          sku,
          quantity: Number.parseFloat(quantity.toString()),
          reorderLevel: Number.parseFloat(reorderLevel.toString()),
          maxCapacity: Number.parseFloat(maxCapacity.toString()),
          supplierId: supplierId || null,
          createdAt: now,
          updatedAt: now,
          variants: {
            create:
              (variants as VariantInput[] | undefined)?.map((v) => ({
                size: v.size,
                quantity: Number.parseFloat(v.quantity.toString()),
              })) || [],
          },
        },
        include: { supplier: true, variants: true },
      })

      return NextResponse.json({ item })
    }

    // Edit Inventory Item
    if (action === "editItem") {
      const { id, name, category, unit, sku, quantity, reorderLevel, maxCapacity, supplierId } = body

      // Check if SKU already exists for other items
      const existingSku = await prisma.inventoryItem.findFirst({
        where: {
          sku,
          NOT: { id: Number.parseInt(id.toString()) },
        },
      })

      if (existingSku) {
        return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
      }

      const item = await prisma.inventoryItem.update({
        where: { id: Number.parseInt(id.toString()) },
        data: {
          name,
          category,
          unit,
          sku,
          quantity: Number.parseFloat(quantity.toString()),
          reorderLevel: Number.parseFloat(reorderLevel.toString()),
          maxCapacity: Number.parseFloat(maxCapacity.toString()),
          supplierId: supplierId || null,
          updatedAt: new Date(),
        },
        include: { supplier: true, variants: true },
      })

      return NextResponse.json({ item })
    }

    // Delete Inventory Item
    if (action === "deleteItem") {
      const { id } = body
      await prisma.inventoryItem.delete({
        where: { id: Number.parseInt(id.toString()) },
      })
      return NextResponse.json({ success: true })
    }

    // Stock In/Out
    if (action === "stockInOut") {
      const { inventoryItemId, type, quantity, price, supplierId, note, orderId } = body
      const parsedQuantity = Number.parseFloat(quantity.toString())
      const parsedPrice = price ? Number.parseFloat(price.toString()) : null

      // Fetch current item to check quantity
      const currentItem = await prisma.inventoryItem.findUnique({
        where: { id: Number.parseInt(inventoryItemId.toString()) },
      })

      if (!currentItem) {
        return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
      }

      if (type === "out" && parsedQuantity > currentItem.quantity) {
        return NextResponse.json(
          { error: "Cannot stock out more than available quantity" },
          { status: 400 }
        )
      }

      // Update inventory quantity
      const item = await prisma.inventoryItem.update({
        where: { id: Number.parseInt(inventoryItemId.toString()) },
        data: {
          quantity: {
            increment: type === "in" ? parsedQuantity : -parsedQuantity,
          },
          updatedAt: new Date(),
        },
      })

      // Record stock in/out
      await prisma.stockInOut.create({
        data: {
          inventoryItemId: Number.parseInt(inventoryItemId.toString()),
          type,
          quantity: parsedQuantity,
          price: parsedPrice,
          supplierId: supplierId || null,
          note: note || null,
          orderId: orderId || null,
        },
      })

      return NextResponse.json({ item })
    }

    // Add Supplier
    if (action === "addSupplier") {
      const { name, contact, email, phone } = body
      const supplier = await prisma.supplier.create({
        data: {
          name,
          contact,
          email: email || null,
          phone: phone || null,
        },
      })
      return NextResponse.json({ supplier })
    }

    // Edit Supplier
    if (action === "editSupplier") {
      const { id, name, contact, email, phone } = body
      const supplier = await prisma.supplier.update({
        where: { id: Number.parseInt(id.toString()) },
        data: {
          name,
          contact,
          email: email || null,
          phone: phone || null,
        },
      })
      return NextResponse.json({ supplier })
    }

    // Delete Supplier
    if (action === "deleteSupplier") {
      const { id } = body

      // Check if supplier has associated items
      const itemsCount = await prisma.inventoryItem.count({
        where: { supplierId: Number.parseInt(id.toString()) },
      })

      if (itemsCount > 0) {
        return NextResponse.json(
          {
            error: "Cannot delete supplier with associated inventory items",
          },
          { status: 400 },
        )
      }

      await prisma.supplier.delete({
        where: { id: Number.parseInt(id.toString()) },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("POST /api/v1/inventory error:", String(error))
    return NextResponse.json(
      {
        error: "Internal server error",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
