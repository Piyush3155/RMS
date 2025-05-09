import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { mkdirSync, existsSync } from "fs"

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const formData = await req.formData()

    const file = formData.get("photo") as File | null
    const name = formData.get("name") as string | null
    const price = formData.get("price") as string | null
    const description = formData.get("description") as string | null
    const category = formData.get("category") as string | null
    const isVeg = formData.get("isVeg") as string | null

    if (!file || !name || !price || !description || !category || isVeg === null) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 })
    }

    // Ensure the "public/uploads" directory exists
    const uploadDir = join(process.cwd(), "public/uploads")
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true })
    }

    // Convert file to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate a unique filename
    const filename = `${Date.now()}-${file.name}`
    const filePath = join(uploadDir, filename)

    // Save file to "public/uploads"
    await writeFile(filePath, buffer)
    console.log("File uploaded successfully:", filename)

    // Save menu item in database
    const menuItem = await prisma.menu.create({
      data: {
        itemName: name,
        price: Number(price),
        imageUrl: `/uploads/${filename}`, // Store relative path
        description,
        category,
        isVeg: isVeg === "true", // Convert string to boolean
      },
    })

    return NextResponse.json({ message: "Menu item added successfully!", menuItem }, { status: 201 })
  } catch (error) {
    console.error("Error adding menu item:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
