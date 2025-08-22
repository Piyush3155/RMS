import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function getDBSchema() {
    // In a real app, you might read the schema.prisma file or have a summarized version.
    // For this example, we'll use a simplified string representation of relevant models.
    return `
      model Staff {
        id        Int      @id @default(autoincrement())
        name      String
        role      String
        phone     String
        email     String?
        photo     String?
        joinedAt  DateTime @default(now())
        status    String   // "Active" | "Inactive"
      }

      model Menu {
        id          Int      @id @default(autoincrement())
        itemName    String
        price       Float
        description String
        imageUrl    String
        category    String
        isVeg       Boolean  @default(true)
      }

      model order2 {
        id          Int      @id @default(autoincrement())
        tableNumber Int
        items       String
        createdAt   DateTime @default(now())
        status      String   @default("pending")
        price       Float
        orderId     Int?
      }

      model InventoryItem {
        id           Int      @id @default(autoincrement())
        name         String
        category     String
        quantity     Float    // Current stock
        reorderLevel Float    // Alert threshold
      }

      model Supplier {
        id          Int      @id @default(autoincrement())
        name        String
        contact     String
        email       String?
      }
    `;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const schema = await getDBSchema();

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const fullPrompt = `
      You are an AI assistant for a restaurant management system.
      Your task is to understand the user's request and identify which database model to query.
      Based on the following database schema, determine the single most relevant model for the user's prompt.
      Respond with only the model name in lowercase. The possible model names are: "staff", "menu", "order2", "inventoryitem", "supplier".
      Do not provide any explanation or other text.

      Schema:
      ${schema}

      User Prompt: "${prompt}"

      Model Name:
    `;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const modelToQuery = response.text().trim().toLowerCase();

    let data;

    switch (modelToQuery) {
      case 'staff':
        data = await prisma.staff.findMany();
        break;
      case 'menu':
        data = await prisma.menu.findMany();
        break;
      case 'order2':
        data = await prisma.order2.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            take: 20
        });
        break;
      case 'inventoryitem':
        data = await prisma.inventoryItem.findMany();
        break;
      case 'supplier':
        data = await prisma.supplier.findMany();
        break;
      default:
        return NextResponse.json({ message: "Sorry, I couldn't understand which data to fetch. Please try a different prompt." }, { status: 400 });
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return NextResponse.json({
        message: `I looked for information about ${modelToQuery}, but couldn't find any data.`,
        data: [],
      });
    }

    const summarizationPrompt = `
      You are a helpful AI assistant for a restaurant management system.
      A user asked the following question: "${prompt}"
      
      I have fetched the following data from the database, which is relevant to their question:
      ${JSON.stringify(data, null, 2)}

      Please provide a concise, human-readable summary of this data in plain text. 
      Do not format it as a table or a list of JSON objects. 
      Instead, present it as a natural language response.
      For example, if asked for staff details, you could say "We have 3 staff members. They are: John Doe who is a Manager, Jane Smith who is a Chef, and Peter Jones who is a Waiter."
      
      Summary:
    `;

    const summaryResult = await model.generateContent(summarizationPrompt);
    const summaryResponse = await summaryResult.response;
    const summaryText = summaryResponse.text().trim();

    return NextResponse.json({
        message: summaryText,
        data: data
    });

  } catch (error) {
    console.error('AI handler error:', error);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
