import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient as PrismaClient1 } from "@prisma/client"
import { randomBytes, createCipheriv } from "crypto"

const prisma1 = new PrismaClient1()

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-byte-key-here'; // Ensure this is 32 bytes
const IV_LENGTH = 16; // AES block size is 16 bytes

// Function to encrypt data
export function encryptData(data: string): string {
  const iv = randomBytes(IV_LENGTH);

  // Ensure ENCRYPTION_KEY is exactly 32 bytes
  const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'utf-8');

  // Pad or trim the key to ensure it's 32 bytes
  const fixedKey = keyBuffer.length < 32
    ? Buffer.concat([keyBuffer, Buffer.alloc(32 - keyBuffer.length)]) // Pad with zeros
    : keyBuffer.slice(0, 32); // Trim to 32 bytes if too long

  const cipher = createCipheriv('aes-256-cbc', fixedKey, iv);

  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    // Find user in database
    const user = await prisma1.user.findFirst({
      where: { username },
    })

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    const response = NextResponse.json({ message: "Login successful", user, redirectUrl: "/dash" }, { status: 200 })

    // Encrypt the username before storing in cookie
    const encryptedUsername = encryptData(username)

    response.cookies.set("Username", encryptedUsername, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
