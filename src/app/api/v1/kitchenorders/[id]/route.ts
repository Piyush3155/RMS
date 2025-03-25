import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/v1/kitchenorders/[id]
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id: orderId } = params;

  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  const id = parseInt(orderId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    console.log("Updating order with ID:", id, "to status:", status);

    const updatedOrder = await prisma.order2.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(
      { message: "Order status updated", order: updatedOrder },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating order status:", error ?? "Unknown error");
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
