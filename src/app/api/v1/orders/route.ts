import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req:NextResponse) {
  try {
    console.log("Request received:", req);

    const body = await req.json();
    console.log("Request body:", body);

    const { username, items: cart } = body; // FIX: Renaming `items` to `cart`

    if (!cart || cart.length === 0) {
      return NextResponse.json({ message: "Cart is empty or invalid request." }, { status: 400 });
    }

    // Create the order
    const order = await prisma.order.create({
      data: {
        username,
        items: {
          create: cart.map((item: any) => ({
            itemName: item.itemName, // Adjusted to match request body structure
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ message: "Order placed successfully!", order }, { status: 201 });
  } catch (error) {
    console.error("Error placing order:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
