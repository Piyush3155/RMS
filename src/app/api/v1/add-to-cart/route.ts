import { NextResponse } from "next/server";
import { PrismaClient as PrismaClient1 } from "../../../../../prisma/generated/client1"; // Import the client for db1

const prisma1 = new PrismaClient1(); // Use the Prisma Client for db1

export async function POST(req: NextResponse) {
  try {
    const { userId, itemName, price, imageUrl } = await req.json();

    // Insert data into the Product table of db1
    const newProduct = await prisma1.product.create({
      data: {  // Default to guest (0) if not logged in
        name: itemName,        // 'name' is expected in your Product model
        price,
        quantity: 1,           // Default quantity
        imageUrl,
      },
    });

    return NextResponse.json({ success: true, data: newProduct });
  } catch (error) {
    console.error("Error adding product:", error);
    return NextResponse.json({ success: false, error: "Failed to add product" }, { status: 500 });
  }
}
