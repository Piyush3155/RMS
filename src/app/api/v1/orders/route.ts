import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, items: cart } = body;

    if (!cart || cart.length === 0) {
      return NextResponse.json({ message: "Cart is empty or invalid request." }, { status: 400 });
    }

    // 1. Create the order and its items
    const order = await prisma.order.create({
      data: {
        username,
        items: {
          create: cart.map((item: { itemName: string; price: number; quantity: number; imageUrl: string }) => ({
            itemName: item.itemName,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
          })),
        },
      },
      include: { items: true },
    });

    // 2. Calculate order analytics
    const totalAmount = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalItemsSold = order.items.reduce((acc, item) => acc + item.quantity, 0);

    // Count item frequencies
    const itemFrequency: Record<string, number> = {};
    for (const item of order.items) {
      itemFrequency[item.itemName] = (itemFrequency[item.itemName] || 0) + item.quantity;
    }

    // Find most sold item in this order
    const topItem = Object.entries(itemFrequency).sort((a, b) => b[1] - a[1])[0];

    // 3. Create OrderAnalytics entry
    await prisma.orderAnalytics.create({
      data: {
        orderId: order.id,
        totalAmount,
        totalItemsSold,
        topItemName: topItem[0],
        topItemCount: topItem[1],
      },
    });

    return NextResponse.json({ message: "Order placed successfully!", order }, { status: 201 });
  } catch (error) {
    console.error("Error placing order:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
