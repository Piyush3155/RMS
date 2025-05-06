import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const orders = await prisma.kitchendashboard.findMany({
      orderBy: { createdAt: "desc" },
    });

    const validOrders = orders
      .map((order) => {
        try {
          return {
            id: order.id,
            tableNumber: order.tableNumber,
            items: JSON.parse(order.items), // Safely parse items
            status: order.status,
            timestamp: order.createdAt,
          };
        } catch {
          console.warn("Skipping malformed order.items:", order.items);
          return null;
        }
      })
      .filter(Boolean); // Remove any nulls caused by failed parsing

    return NextResponse.json(validOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
