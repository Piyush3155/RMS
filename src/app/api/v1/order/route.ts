import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { table, items } = await req.json();

    const order = await prisma.order2.create({
      data: {
        tableNumber: parseInt(table),
        items: JSON.stringify(items),
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, order }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Database error!" }, { status: 500 });
  }
}
