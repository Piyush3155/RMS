import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generatePassword, hashPassword } from "@/lib/password-generator"

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Normalize to start of day

    // Tuesday is a holiday (0=Sun, 1=Mon, 2=Tue, ...)
    if (today.getDay() !== 2) {
      // Get all active staff
      const activeStaff = await prisma.staff.findMany({
        where: { status: "Active" },
      })

      if (activeStaff.length > 0) {
        // Get today's attendance records for all active staff
        const todaysAttendance = await prisma.staffAttendance.findMany({
          where: {
            staffId: { in: activeStaff.map((s) => s.id) },
            date: {
              gte: today,
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            },
          },
        })

        const staffWithAttendance = new Set(todaysAttendance.map((a) => a.staffId))

        const staffToMarkAbsent = activeStaff.filter((staff) => !staffWithAttendance.has(staff.id))

        if (staffToMarkAbsent.length > 0) {
          await prisma.staffAttendance.createMany({
            data: staffToMarkAbsent.map((staff) => ({
              staffId: staff.id,
              date: today,
              status: "Absent",
            })),
            skipDuplicates: true, // Avoid errors if the job runs multiple times a day
          })
        }
      }
    }

    const staff = await prisma.staff.findMany({
      include: {
        attendance: {
          orderBy: { date: "desc" },
          take: 30, // Last 30 attendance records
        },
        _count: {
          select: { attendance: true },
        },
      },
      orderBy: { joinedAt: "desc" },
    })
    return NextResponse.json(staff)
  } catch (error) {
    console.error("Error fetching staff:", error)
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    // Log the received data for debugging
    console.log("Received form data:")
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value)
    }

    const name = formData.get("name") as string
    const role = formData.get("role") as string
    const phone = formData.get("phone") as string
    const email = formData.get("email") as string
    const status = formData.get("status") as string
    const joinedAt = formData.get("joinedAt") as string
    const photoFile = formData.get("photo") as File | null

    // Validate required fields
    if (!name || !role || !phone || !joinedAt) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: {
            name: !name ? "Name is required" : null,
            role: !role ? "Role is required" : null,
            phone: !phone ? "Phone is required" : null,
            joinedAt: !joinedAt ? "Joining date is required" : null,
          },
        },
        { status: 400 },
      )
    }

    // Check if staff with same phone already exists
    const existingStaff = await prisma.staff.findFirst({
      where: { phone },
    })

    if (existingStaff) {
      return NextResponse.json(
        {
          error: "Staff member with this phone number already exists",
          existingStaff: existingStaff.name,
        },
        { status: 400 },
      )
    }

    // Check if email already exists in admin table (if email is provided)
    if (email) {
      const existingAdmin = await prisma.admin.findFirst({
        where: { email },
      })

      if (existingAdmin) {
        return NextResponse.json(
          {
            error: "Email already exists in the system",
          },
          { status: 400 },
        )
      }
    }

    let photoPath: string | null = null

    if (photoFile && photoFile.name && photoFile.size > 0) {
      try {
        const bytes = await photoFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const filename = `${Date.now()}-${photoFile.name.replace(/\s+/g, "_")}`

        // Ensure the directory exists
        const uploadDir = path.join(process.cwd(), "public", "staff")
        await mkdir(uploadDir, { recursive: true })

        const filePath = path.join(uploadDir, filename)
        await writeFile(filePath, buffer)
        photoPath = `/staff/${filename}`
      } catch (photoError) {
        console.error("Photo upload error:", photoError)
        // Continue without photo if upload fails
        photoPath = null
      }
    }

    // Generate password based on personal details
    const generatedPassword = generatePassword({
      name,
      role,
      phone,
      joinedAt,
    })

    console.log(`Generated password for ${name}: ${generatedPassword}`)

    // Hash the password
    const hashedPassword = await hashPassword(generatedPassword)

    // Start a transaction to create both staff and admin records
    const result = await prisma.$transaction(async (tx) => {
      // Create staff record
      const staff = await tx.staff.create({
        data: {
          name,
          role,
          phone,
          email: email || null,
          photo: photoPath,
          status: status || "Active",
          joinedAt: new Date(joinedAt),
        },
        include: {
          attendance: true,
          _count: {
            select: { attendance: true },
          },
        },
      })

      // Create admin record if email is provided
      let adminRecord = null
      if (email) {
        adminRecord = await tx.admin.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: role.toLowerCase(), // Store role in lowercase for consistency
          },
        })
      }

      return { staff, admin: adminRecord, generatedPassword }
    })

    // Return success response with generated password (for display purposes)
    return NextResponse.json({
      ...result.staff,
      loginCredentials: email ? {
        email,
        password: generatedPassword,
        message: "Login credentials have been generated for this staff member"
      } : null
    }, { status: 201 })

  } catch (error) {
    console.error("Error adding staff:", error)

    // Return more detailed error information
    return NextResponse.json(
      {
        error: "Failed to add staff",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : null) : null,
      },
      { status: 500 },
    )
  }
}
