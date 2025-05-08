import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Allowed order statuses (update these based on your app)
const allowedStatuses = ["pending", "preparing", "completed"];

// PUT /api/v1/kitchenorders/[id]
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  const id = Number(orderId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    console.log("Updating order with ID:", id, "to status:", status);

    const updatedOrder = await prisma.kitchendashboard.update({
      where: { id },
      data: { status },
    });


    return NextResponse.json(
      { message: "Order status updated", kitchenOrder: updatedOrder },
      
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
// DELETE /api/v1/kitchenorders/[id]
// DELETE /api/v1/kitchenorders/[id]
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  const id = Number(orderId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  try {
    console.log(`Deleting order with ID: ${id}`);

    await prisma.kitchendashboard.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
