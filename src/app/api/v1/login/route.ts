import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sign } from "jsonwebtoken";
import { serialize } from "cookie";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key"; // Store this securely in .env

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Find admin in the database
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    // If admin not found or password does not match
    if (!admin || admin.password !== password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Generate JWT Token
    const token = sign({ id: admin.id, email: admin.email }, SECRET_KEY, { expiresIn: "1d" });

    // Set Token in Cookies
    const response = NextResponse.json({ success: true, message: "Login successful" });
    response.headers.set(
      "Set-Cookie",
      serialize("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      })
    );

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
