import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { table, items, price } = await req.json();
    const tableNumber = parseInt(table);
    const totalPrice = parseFloat(price);

    const result = await prisma.$transaction(async (prisma) => {
      const existingOrders = await prisma.fetchorder.findMany({
        where: {
          tableNumber,
          status: "pending",
        },
      });

      if (existingOrders.length > 0) {
        const existingItemMap = new Map(
          existingOrders.map((order) => [order.itemName, order])
        );

        for (const item of items) {
          const itemName = item.itemName;
          const itemQuantity = parseInt(item.quantity);
          const itemPrice = parseFloat(item.price);

          const existingItem = existingItemMap.get(itemName);
          if (existingItem) {
            // Update quantity, price, and items field (stringified name list)
            await prisma.fetchorder.update({
              where: { id: existingItem.id },
              data: {
                quantity: (existingItem.quantity ?? 0) + itemQuantity,
                price: (existingItem.price ?? 0) + itemPrice,
                items: itemName,
              },
            });
          } else {
            // Insert new item for the existing table
            await prisma.fetchorder.create({
              data: {
                tableNumber,
                items: itemName,
                itemName,
                quantity: itemQuantity,
                price: itemPrice,
                status: "pending",
                orderId: existingOrders[0].orderId ?? existingOrders[0].id,
              },
            });
          }
        }

        return { message: "Items updated for existing table" };
      } else {
        // Create new order2
        const order = await prisma.order2.create({
          data: {
            tableNumber,
            items: JSON.stringify(items),
            status: "pending",
            price: totalPrice,
          },
        });

        // Create new kitchenDashboard
        const kitchenOrder = await prisma.kitchendashboard.create({
          data: {
            id: order.id,
            tableNumber,
            items: JSON.stringify(items),
            status: "pending",
          },
        });

        // Insert into fetchorder
        await prisma.fetchorder.createMany({
          data: items.map((item: { itemName: string; quantity: string; price: string }) => ({
            tableNumber,
            items: item.itemName,
            itemName: item.itemName,
            quantity: parseInt(item.quantity),
            price: parseFloat(item.price),
            status: "pending",
            orderId: order.id,
          })),
        });

        return {
          message: "New order created",
          order,
          kitchenOrder,
        };
      }
    });

    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error!" }, { status: 500 });
  }
}
