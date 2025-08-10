import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import formidable from "formidable"
import fs from "fs"
import streamifier from "streamifier"
import type { IncomingMessage } from "http"

export const config = {
  api: {
    bodyParser: false,
  },
}

const emailUser = process.env.EMAIL_USER
const emailPass = process.env.EMAIL_PASS

export async function POST(req: NextRequest) {
  try {
    // Read the entire body as a buffer
    const chunks = []
    const reader = (req.body as ReadableStream<Uint8Array>).getReader()
    let done = false
    while (!done) {
      const { value, done: d } = await reader.read()
      if (value) chunks.push(Buffer.from(value))
      done = d
    }
    const buffer = Buffer.concat(chunks)
    // Convert buffer to a Node.js readable stream for formidable
    const nodeReq = streamifier.createReadStream(buffer);

    // Create a mock request object for formidable with headers and method
    const mockReq = Object.assign(nodeReq, {
      headers: Object.fromEntries(req.headers.entries()),
      method: req.method,
    });

    const form = formidable();
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(mockReq as IncomingMessage, (err, fields, files) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })

    const typeField = fields.type;
    const type = Array.isArray(typeField) ? typeField[0] : typeField;
    const messageField = fields.message;
    const message = Array.isArray(messageField) ? messageField[0] : messageField || "";
    const emails: string[] = Array.isArray(fields["emails[]"])
      ? (fields["emails[]"] as string[]).filter(Boolean)
      : fields["emails[]"]
      ? [fields["emails[]"] as string].filter(Boolean)
      : [];
    const imageFileRaw = files.image;
    const imageFile = Array.isArray(imageFileRaw) ? imageFileRaw[0] : imageFileRaw;

    if (type !== "email") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const attachments: { filename: string; path: string }[] | undefined =
      imageFile && imageFile.size > 0
        ? [
            {
              filename: imageFile.originalFilename || "attachment",
              path: imageFile.filepath,
            },
          ]
        : undefined;

    let results;
    try {
      results = await Promise.all(
        emails.map((to: string) =>
          transporter.sendMail({
            from: emailUser,
            to,
            subject: "Message from Bite & Co",
            html: message,
            ...(attachments ? { attachments } : {}),
          })
        )
      );
    } catch (mailError) {
      console.error("Email sending error:", mailError);
      throw mailError;
    }

    // Remove temp image file after sending
    if (attachments && attachments.length > 0 && imageFile && imageFile.filepath) {
      try {
        fs.unlinkSync(imageFile.filepath);
      } catch (fileError) {
        console.error("File deletion error:", fileError);
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("API error:", error)
    const errorMessage = typeof error === "object" && error !== null && "message" in error
      ? (error as { message: string }).message
      : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

