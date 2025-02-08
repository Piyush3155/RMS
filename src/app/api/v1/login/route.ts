import { NextRequest, NextResponse } from "next/server";
import { PrismaClient as PrismaClient1 } from "../../../../../prisma/generated/client1";
import { PrismaClient as PrismaClient2 } from "../../../../../prisma/generated/client2";

const prisma1 = new PrismaClient1();
const prisma2 = new PrismaClient2();
export async function POST(req: NextRequest) {
  try {
    const { username, password, role } = await req.json();

    console.log({ username, password, role });

    // Find user by username and role
    const user = await prisma1.user.findFirst({
      where: { username, role },
    });

    // Check if user exists and password matches
    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid username, password, or role" }, { status: 401 });
    }

    // Define redirection based on role
    let redirectUrl = "/profile"; // Default redirect
    if (role === "admin") {
      redirectUrl = "/admin";
    } else if (role === "superadmin") {
      redirectUrl = "/manager";
    } else if (role === "user") {
      redirectUrl = "/user";
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 });
    }

    return NextResponse.json(
      { message: "Login successful", user, redirectUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
