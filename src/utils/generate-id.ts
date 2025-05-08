/**
 * Generates a random 6-digit order ID
 * @returns A number between 100000 and 999999
 */
export function generateNumericOrderId(): number {
    // Generate a random 6-digit number (between 100000 and 999999)
    return Math.floor(100000 + Math.random() * 900000)
  }
  
  /**
   * Checks if the generated numeric order ID already exists in the database
   * @param prisma PrismaClient instance
   * @param orderId The numeric order ID to check
   * @returns Boolean indicating if the ID exists
   */
  import { PrismaClient } from '@prisma/client';

  export async function orderIdExists(prisma: PrismaClient, orderId: number): Promise<boolean> {
    // Check if the order ID exists in order2 table
    const existingOrder = await prisma.order2.findFirst({
      where: {
        orderId: orderId,
      },
    })
  
    // Check if the order ID exists in kitchendashboard table
    const existingKitchenOrder = await prisma.kitchendashboard.findFirst({
      where: {
        orderId: orderId,
      },
    })
  
    return !!existingOrder || !!existingKitchenOrder
  }
  
  /**
   * Generates a unique 6-digit numeric order ID that doesn't exist in the database
   * @param prisma PrismaClient instance
   * @returns A unique 6-digit numeric order ID
   */
  export async function generateUniqueNumericOrderId(prisma: PrismaClient): Promise<number> {
    let orderId = generateNumericOrderId()
    let exists = await orderIdExists(prisma, orderId)
  
    // Keep generating until we find a unique ID
    while (exists) {
      orderId = generateNumericOrderId()
      exists = await orderIdExists(prisma, orderId)
    }
  
    return orderId
  }
  