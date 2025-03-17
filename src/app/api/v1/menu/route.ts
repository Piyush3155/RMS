import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Ensure you have Prisma setup

export async function GET() {
  try {
    const menuItems = await prisma.menu.findMany(); // Fetch all menu items
    return NextResponse.json(menuItems, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 });
  }
}
