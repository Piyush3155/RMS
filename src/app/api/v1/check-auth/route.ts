import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

export async function GET(req: Request) {
  const token = req.headers.get("cookie")?.split("auth_token=")[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = verify(token, SECRET_KEY);
    return NextResponse.json({ success: true, admin: decoded });
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
