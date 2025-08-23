import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function getDBSchema() {
    // Provide a simplified textual schema for the models we allow the assistant to pick from.
    // Excluded: InventoryVariant, Recipe, RecipeIngredient, Wastage, PurchaseOrder, PurchaseOrderItem, RagDocument, RagQuery
    return `
      model admin {
        id       Int    @id @default(autoincrement())
        name     String
        email    String @unique
        password String
        role     String
      }

      model kitchendashboard {
        id          Int      @id @default(autoincrement())
        tableNumber Int
        items       String
        status      String   @default("pending")
        createdAt   DateTime @default(now())
        orderId     Int?
      }

      model Staff {
        id        Int      @id @default(autoincrement())
        name      String
        role      String
        phone     String
        email     String?
        photo     String?
        joinedAt  DateTime @default(now())
        status    String
      }

      model StaffAttendance {
        id        Int      @id @default(autoincrement())
        staffId   Int
        date      DateTime
        checkIn   DateTime?
        checkOut  DateTime?
        status    String
      }

      model Menu {
        id          Int      @id @default(autoincrement())
        itemName    String
        price       Float
        description String
        imageUrl    String
        category    String
        isVeg       Boolean  @default(true)
        createdAt   DateTime @default(now())
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

      model orderanalytics {
        id             Int      @id @default(autoincrement())
        orderId        Int      @unique
        totalAmount    Float
        totalItemsSold Int
        topItemName    String
        topItemCount   Int
        createdAt      DateTime @default(now())
        numericOrderId Int?
      }

      model InventoryItem {
        id           Int      @id @default(autoincrement())
        name         String
        category     String
        unit         String
        sku          String   @unique
        quantity     Float
        reorderLevel Float
        maxCapacity  Float
        supplierId   Int?
        createdAt    DateTime @default(now())
        updatedAt    DateTime @updatedAt
      }

      model Supplier {
        id          Int      @id @default(autoincrement())
        name        String
        contact     String
        email       String?
        phone       String?
      }

      model StockInOut {
        id             Int      @id @default(autoincrement())
        inventoryItemId Int
        type           String
        quantity       Float
        price          Float?
        date           DateTime @default(now())
        supplierId     Int?
        note           String?
        orderId        Int?
      }

      model CustomerContact {
        id        Int     @id @default(autoincrement())
        contactNo String? @unique
        email     String? @unique
        createdAt DateTime @default(now())
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // 1) Determine which model to query (existing logic)
    const modelSelectPrompt = `
      You are an AI assistant for a restaurant management system.
      Determine the single most relevant model (from the list) for this user prompt.
      Respond with only the model name in lowercase.

      Possible model names: admin, kitchendashboard, staff, staffattendance, menu, order2, orderanalytics, inventoryitem, supplier, stockinout, customercontact.

      Schema:
      ${schema}

      User Prompt: "${prompt}"

      Model Name:
    `;
    const selectResult = await model.generateContent(modelSelectPrompt);
    const selectResp = await selectResult.response;
    const modelToQuery = selectResp.text().trim().toLowerCase();

    // Validate modelToQuery
    const allowedModels = new Set([
      'admin','kitchendashboard','staff','staffattendance','menu','order2','orderanalytics','inventoryitem','supplier','stockinout','customercontact'
    ]);
    if (!allowedModels.has(modelToQuery)) {
      return NextResponse.json({ message: "Sorry, I couldn't determine which data to fetch. Try rephrasing your prompt." }, { status: 400 });
    }

    // 2) Ask the model which fields/filters/limit/order to use (strict JSON)
    const allowedFieldsMap: Record<string, string[]> = {
      admin: ['id','name','email','role'],
      kitchendashboard: ['id','tableNumber','items','status','createdAt','orderId'],
      staff: ['id','name','role','phone','email','photo','joinedAt','status'],
      staffattendance: ['id','staffId','date','checkIn','checkOut','status'],
      menu: ['id','itemName','price','description','imageUrl','category','isVeg','createdAt'],
      order2: ['id','tableNumber','items','createdAt','status','price','orderId'],
      orderanalytics: ['id','orderId','totalAmount','totalItemsSold','topItemName','topItemCount','createdAt','numericOrderId'],
      inventoryitem: ['id','name','category','unit','sku','quantity','reorderLevel','maxCapacity','supplierId','createdAt','updatedAt'],
      supplier: ['id','name','contact','email','phone'],
      stockinout: ['id','inventoryItemId','type','quantity','price','date','supplierId','note','orderId'],
      customercontact: ['id','contactNo','email','createdAt'],
    };

    const fieldsPrompt = `
      Based on the user prompt and schema, output a compact JSON (and ONLY the JSON) describing:
        - fields: an array of field names (from this model) to select, or ["*"] to select all.
        - where: a short simple filter string (e.g. "name contains John" or "status = active") or "" if none.
        - limit: integer maximum number of records to fetch, or null.
        - orderBy: field name to order by or "".
        - orderDir: "asc" or "desc" or "".

      Allowed fields for model "${modelToQuery}": ${JSON.stringify(allowedFieldsMap[modelToQuery])}

      User Prompt: "${prompt}"

      Example valid JSON:
      {"fields":["name"],"where":"name contains John","limit":10,"orderBy":"name","orderDir":"asc"}
    `;
    const fieldsResult = await model.generateContent(fieldsPrompt);
    const fieldsResp = await fieldsResult.response;
    const fieldsText = fieldsResp.text().trim();

    let parsed: { fields: string[]; where?: string; limit?: number | null; orderBy?: string; orderDir?: string } = {
      fields: ['*'],
      where: '',
      limit: null,
      orderBy: '',
      orderDir: '',
    };

    try {
      // Try to extract JSON from response (allow stray text)
      const jsonStart = fieldsText.indexOf('{');
      const jsonStr = jsonStart >= 0 ? fieldsText.slice(jsonStart) : fieldsText;
      parsed = JSON.parse(jsonStr);
    } catch  {
      // fallback: if parsing failed, keep default (select all)
      parsed = parsed;
    }

    // sanitize parsed fields to allowed set
    const allowed = new Set(allowedFieldsMap[modelToQuery]);
    const requestedFields = Array.isArray(parsed.fields) && parsed.fields.length > 0
      ? parsed.fields.filter((f) => f === '*' || allowed.has(f))
      : ['*'];

    const whereStr = typeof parsed.where === 'string' ? parsed.where.trim() : '';
    const limit = typeof parsed.limit === 'number' ? parsed.limit : null;
    const orderBy = typeof parsed.orderBy === 'string' ? parsed.orderBy.trim() : '';
    const orderDir = parsed.orderDir === 'asc' ? 'asc' : parsed.orderDir === 'desc' ? 'desc' : undefined;

    // helper: build simple Prisma where from whereStr (supports "field contains value" and "field = value")
    const buildWhere = (s: string) => {
      if (!s) return undefined;
      // examples: "name contains John", "status = pending", "id = 5"
      const containsMatch = s.match(/^([\w]+)\s+contains\s+["']?(.+?)["']?$/i);
      if (containsMatch) {
        const f = containsMatch[1];
        const v = containsMatch[2];
        if (allowed.has(f)) return { [f]: { contains: v, mode: 'insensitive' } };
      }
      const equalsMatch = s.match(/^([\w]+)\s*(=|equals|is)\s*["']?(.+?)["']?$/i);
      if (equalsMatch) {
        const f = equalsMatch[1];
        const v = equalsMatch[3];
        if (allowed.has(f)) {
          // numeric?
          if (!Number.isNaN(Number(v)) && /^\d+$/.test(v)) return { [f]: Number(v) };
          return { [f]: v };
        }
      }
      // fallback none
      return undefined;
    };

    const prismaWhere = buildWhere(whereStr);

    // prepare select object
    const makeSelect = (fields: string[]) => {
      if (fields.length === 0 || (fields.length === 1 && fields[0] === '*')) return undefined;
      return fields.reduce<Record<string, boolean>>((acc, f) => {
        acc[f] = true;
        return acc;
      }, {});
    };
    const selectObj = makeSelect(requestedFields);

    // 3) Execute Prisma query with select/where/limit/orderBy using explicit switch (type-safe)
        let data: unknown[] = [];
        switch (modelToQuery) {
          case 'admin':
            data = await prisma.admin.findMany({
              where: prismaWhere as Prisma.adminWhereInput | undefined,
              select: selectObj as Prisma.adminSelect | undefined,
              take: limit ?? undefined,
              orderBy: orderBy ? { [orderBy]: orderDir ?? 'desc' } : undefined,
            });
            break;
          case 'kitchendashboard':
            data = await prisma.kitchendashboard.findMany({
              where: prismaWhere as Prisma.kitchendashboardWhereInput | undefined,
              select: selectObj as Prisma.kitchendashboardSelect | undefined,
              take: limit ?? undefined,
              orderBy: orderBy ? { [orderBy]: orderDir ?? 'desc' } : { createdAt: 'desc' },
            });
            break;
          case 'staff':
            data = await prisma.staff.findMany({
              where: prismaWhere as Prisma.StaffWhereInput | undefined,
              select: selectObj as Prisma.StaffSelect | undefined,
              take: limit ?? undefined,
              orderBy: orderBy ? { [orderBy]: orderDir ?? 'desc' } : { joinedAt: 'desc' },
            });
            break;
          case 'staffattendance':
            data = await prisma.staffAttendance.findMany({
              where: prismaWhere as Prisma.StaffAttendanceWhereInput | undefined,
              select: selectObj as Prisma.StaffAttendanceSelect | undefined,
              take: limit ?? undefined,
              orderBy: orderBy ? { [orderBy]: orderDir ?? 'desc' } : { date: 'desc' },
            });
            break;
          case 'menu':
            data = await prisma.menu.findMany({
              where: prismaWhere as Prisma.MenuWhereInput | undefined,
              select: selectObj as Prisma.MenuSelect | undefined,
              take: limit ?? undefined,
              orderBy: orderBy ? { [orderBy]: orderDir ?? 'desc' } : { createdAt: 'desc' },
            });
            break;
          case 'order2':
            data = await prisma.order2.findMany({
              where: prismaWhere as Prisma.order2WhereInput | undefined,
              select: selectObj as Prisma.order2Select | undefined,
              take: limit ?? undefined,
              orderBy: orderBy ? { [orderBy]: orderDir ?? 'desc' } : { createdAt: 'desc' },
            });
            break;
          case 'orderanalytics':
            data = await prisma.orderanalytics.findMany({
              where: prismaWhere as Prisma.orderanalyticsWhereInput | undefined,
              select: selectObj as Prisma.orderanalyticsSelect | undefined,
              take: limit ?? undefined,
              orderBy: orderBy ? { [orderBy]: orderDir ?? 'desc' } : { createdAt: 'desc' },
            });
            break;
          case 'inventoryitem':
            data = await prisma.inventoryItem.findMany({
              where: prismaWhere as Prisma.InventoryItemWhereInput | undefined,
              select: selectObj as Prisma.InventoryItemSelect | undefined,
              take: limit ?? undefined,
              orderBy: orderBy ? { [orderBy]: orderDir ?? 'desc' } : { updatedAt: 'desc' },
            });
            break;
          case 'supplier':
            data = await prisma.supplier.findMany({
              where: prismaWhere as Prisma.SupplierWhereInput | undefined,
              select: selectObj as Prisma.SupplierSelect | undefined,
              take: limit ?? undefined,
            });
            break;
          case 'stockinout':
            data = await prisma.stockInOut.findMany({
              where: prismaWhere as Prisma.StockInOutWhereInput | undefined,
              select: selectObj as Prisma.StockInOutSelect | undefined,
              take: limit ?? undefined,
              orderBy: orderBy ? { [orderBy]: orderDir ?? 'desc' } : { date: 'desc' },
            });
            break;
          case 'customercontact':
            data = await prisma.customerContact.findMany({
              where: prismaWhere as Prisma.CustomerContactWhereInput | undefined,
              select: selectObj as Prisma.CustomerContactSelect | undefined,
              take: limit ?? undefined,
              orderBy: orderBy ? { [orderBy]: orderDir ?? 'desc' } : { createdAt: 'desc' },
            });
            break;
          default:
            return NextResponse.json({ message: "Could not query the model." }, { status: 400 });
        }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      const noDataMsg = `I searched for information related to your request (model: ${modelToQuery}) but couldn't find any records.`;
      return NextResponse.json({ message: noDataMsg });
    }

    // 4) Ask the model to produce a concise human-readable answer; if single-field was requested, instruct it to output values directly.
    const singleField = selectObj && Object.keys(selectObj).length === 1 ? Object.keys(selectObj)[0] : null;
    const summarizationPrompt = `
      You are a helpful and precise assistant.
      A user asked: "${prompt}"

      I fetched the following data (from the "${modelToQuery}" model). Present a concise, accurate answer that directly satisfies the user's request.
      ${singleField ? 'Since only one field was requested, list the values directly (comma separated) or short sentence.' : 'Do not output raw JSON.'}

      Data (JSON):
      ${JSON.stringify(data, null, 2)}

      Summary:
    `;

    const summaryResult = await model.generateContent(summarizationPrompt);
    const summaryResponse = await summaryResult.response;
    const summaryText = summaryResponse.text().trim();

    return NextResponse.json({ message: summaryText });
  } catch (error) {
    console.error('AI handler error:', error);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
