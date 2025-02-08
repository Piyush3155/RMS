import { NextRequest, NextResponse } from "next/server";
import { PrismaClient as PrismaClient1 } from "../../../../../prisma/generated/client1";
import { PrismaClient as PrismaClient2 } from "../../../../../prisma/generated/client2";

const prisma1 = new PrismaClient1();
const prisma2 = new PrismaClient2();

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, role } = await req.json();

    // Create user in the first database
    const newUserDB1 = await prisma1.user.create({
      data: { username, email, password, role },
    });

    // Optionally, create user in the second database
    const newUserDB2 = await prisma2.user.create({
      data: { username, email, password, role },
    });

    // Define redirection based on role
    let redirectUrl = "/profile"; // Default redirect
    if (role === "admin") {
      redirectUrl = "/admin";
    } else if (role === "user") {
      redirectUrl = "/user";
    } else if (role === "superadmin") {
      redirectUrl = "/manager";
    }

    // Set cookies for the session (you can use username, role, or a JWT token)
    const response = NextResponse.json(
      {
        message: "User registered successfully",
        newUserDB1,
        newUserDB2,
        redirectUrl,
      },
      { status: 201 }
    );

    // Set cookies with expiration
    const cookieMaxAge = 60 * 60 * 24 * 7; // 1 week
    response.cookies.set("username", username, { maxAge: cookieMaxAge, path: "/" });
    response.cookies.set("role", role, { maxAge: cookieMaxAge, path: "/" });
    response.cookies.set("password",password,{ maxAge: cookieMaxAge, path: "/" });
    // If you're using JWT, you can set the token here
    // response.cookies.set("auth_token", token, { maxAge: cookieMaxAge, path: "/" });

    return response;
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
