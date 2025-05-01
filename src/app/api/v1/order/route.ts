import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { table, items } = await req.json();

    // Start a transaction to insert data into both tables
    const result = await prisma.$transaction(async (prisma) => {
      // Insert into order2 table
      const order = await prisma.order2.create({
        data: {
          tableNumber: parseInt(table),
          items: JSON.stringify(items),
          status: "pending",
        },
      });

      // Insert into kitchenDashboard table
      const kitchenOrder = await prisma.kitchendashboard.create({
        data: {
          id: order.id, // Use the ID from the order2 table
          tableNumber: parseInt(table),
          items: JSON.stringify(items),
          status: "pending", // Initial status
        },
      });

      return { order, kitchenOrder }; // Return both order and kitchenOrder data
    });

    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error!" }, { status: 500 });
  }
}
