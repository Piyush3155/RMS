// middleware.ts
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { PrismaClient as PrismaClient1 } from "..//prisma/generated/client1"; 
import { PrismaClient as PrismaClient2 } from "..//prisma/generated/client2";

const prisma1 = new PrismaClient1();
const prisma2 = new PrismaClient2();

interface UserRegistrationData {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'superadmin';
}

interface LoginData {
  username: string;
  password: string;
  role: 'user' | 'admin' | 'superadmin';
}

export async function middleware(req: NextRequest) {
  // Handle user registration
  if (req.nextUrl.pathname === "/api/v1/register" && req.method === "POST") {
    try {
      const { username, email, password, role }: UserRegistrationData = await req.json();

      // Validate required fields for registration
      if (!username || !email || !password || !role) {
        return new NextResponse("Missing required fields", { status: 400 });
      }

      // Check if the username already exists in the first database
      const existingUser = await prisma1.user.findUnique({
        where: { username },
      });
      
      if (existingUser) {
        return new NextResponse("Username already taken", { status: 400 });
      }

      // Optionally check the second database as well
      const existingUserInSecondDB = await prisma2.user.findUnique({
        where: { username },
      });

      if (existingUserInSecondDB) {
        return new NextResponse("Username already taken in secondary DB", { status: 400 });
      }

      return NextResponse.next(); // Proceed to registration handler if no errors

    } catch (error) {
      console.error("Error during registration validation:", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  }

  // Handle user login
  if (req.nextUrl.pathname === "/api/v1/login" && req.method === "POST") {
    try {
      const { username, password, role }: LoginData = await req.json();

      // Validate required fields for login
      if (!username || !password || !role) {
        return new NextResponse("Missing required fields", { status: 400 });
      }

      // Check if the user exists and validate credentials in the first database
      const user = await prisma1.user.findFirst({
        where: { username, role },
      });

      if (!user || user.password !== password) {
        return new NextResponse("Invalid username, password, or role", { status: 401 });
      }

      // Optionally check the second database
      const userInSecondDB = await prisma2.user.findFirst({
        where: { username, role },
      });

      if (!userInSecondDB || userInSecondDB.password !== password) {
        return new NextResponse("Invalid username, password, or role in second DB", { status: 401 });
      }

      return NextResponse.next(); // Proceed to login handler if credentials are valid

    } catch (error) {
      console.error("Error during login validation:", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  }

  // If the request is for another path, pass it along
  return NextResponse.next();
}
