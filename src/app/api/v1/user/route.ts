import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    // Create user in the first database
    const newUserDB1 = await prisma.user.create({
      data: { username, email, password },
    });

    // Default redirection
    const redirectUrl = "/dash  ";

    // Set response with user data and redirection
    return NextResponse.json(
      {
        message: "User registered successfully",
        newUserDB1,
        redirectUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
