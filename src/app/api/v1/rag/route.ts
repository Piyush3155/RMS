import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Document upload
  if (body.content) {
    const { content, embedding, source } = body;
    const doc = await prisma.ragDocument.create({
      data: { content, embedding, source }
    });
    return NextResponse.json(doc);
  }

  // Query
  if (body.query) {
    const { query } = body;
    // Find similar documents (simple cosine similarity, or use a vector DB)
    // For demo, fetch all documents
    const docs = await prisma.ragDocument.findMany();
    // TODO: Compute similarity and select top docs
    const retrievedIds = docs.map(d => d.id).join(',');
    // TODO: Generate response using your LLM (call OpenAI, etc.)
    const response = "Generated response here";
    const ragQuery = await prisma.ragQuery.create({
      data: { query, retrievedIds, response }
    });
    return NextResponse.json(ragQuery);
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
