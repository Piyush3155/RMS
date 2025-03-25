import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfToday, startOfWeek, startOfMonth } from 'date-fns';

export async function GET() {
  try {
    const today = startOfToday();
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    const monthStart = startOfMonth(new Date());

    const [todaySales] = await prisma.$queryRawUnsafe<any[]>(`
      SELECT SUM(oi.price * oi.quantity) as total
      FROM OrderItem oi
      JOIN \`Order\` o ON oi.orderId = o.id
      WHERE o.createdAt >= ?
    `, today);

    const [weeklySales] = await prisma.$queryRawUnsafe<any[]>(`
      SELECT SUM(oi.price * oi.quantity) as total
      FROM OrderItem oi
      JOIN \`Order\` o ON oi.orderId = o.id
      WHERE o.createdAt >= ?
    `, weekStart);

    const [monthlySales] = await prisma.$queryRawUnsafe<any[]>(`
      SELECT SUM(oi.price * oi.quantity) as total
      FROM OrderItem oi
      JOIN \`Order\` o ON oi.orderId = o.id
      WHERE o.createdAt >= ?
    `, monthStart);

    return NextResponse.json({
      todaySales: todaySales.total || 0,
      weeklySales: weeklySales.total || 0,
      monthlySales: monthlySales.total || 0,
    });

  } catch (error) {
    console.error('Sales Analysis Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
