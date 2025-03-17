import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {  // Correct relation name from Order model
          select: {
            itemName: true,
            price: true,
            imageUrl:true,
            quantity: true,
          },
        },
      },
      
    });

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ message: "Error fetching orders" }, { status: 500 });
  }
}
