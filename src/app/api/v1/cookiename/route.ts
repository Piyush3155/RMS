import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('username')?.value;

    if (!email) {
      return NextResponse.json({ error: 'No email found in cookies' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    return NextResponse.json({ name: admin.name });
  } catch (error) {
    console.error('Error fetching admin name:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
