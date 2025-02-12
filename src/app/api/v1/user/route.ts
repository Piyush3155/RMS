import { NextRequest, NextResponse } from "next/server";
import { PrismaClient as PrismaClient1 } from "../../../../../prisma/generated/client1";
import { PrismaClient as PrismaClient2 } from "../../../../../prisma/generated/client2";

const prisma1 = new PrismaClient1();
const prisma2 = new PrismaClient2();

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    // Create user in the first database
    const newUserDB1 = await prisma1.user.create({
      data: { username, email, password },
    });

    // Optionally, create user in the second database
    const newUserDB2 = await prisma2.user.create({
      data: { username, email, password },
    });

    // Default redirection
    const redirectUrl = "/dash";

    // Set response with user data and redirection
    return NextResponse.json(
      {
        message: "User registered successfully",
        newUserDB1,
        newUserDB2,
        redirectUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
