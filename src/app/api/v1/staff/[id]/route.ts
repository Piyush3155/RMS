import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generatePassword, hashPassword } from "@/lib/password-generator"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params
    const id = Number.parseInt(idParam)
    const formData = await req.formData()

    const name = formData.get("name") as string
    const role = formData.get("role") as string
    const phone = formData.get("phone") as string
    const email = formData.get("email") as string
    const status = formData.get("status") as string
    const joinedAt = formData.get("joinedAt") as string
    const photoFile = formData.get("photo") as File | null

    // Check if another staff member has the same phone
    const existingStaff = await prisma.staff.findFirst({
      where: {
        phone,
        NOT: { id },
      },
    })

    if (existingStaff) {
      return NextResponse.json({ error: "Another staff member with this phone number already exists" }, { status: 400 })
    }

    // Get current staff data for photo handling and admin record
    const currentStaff = await prisma.staff.findUnique({
      where: { id },
    })

    if (!currentStaff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Check if email is being changed and if new email already exists
    if (email && email !== currentStaff.email) {
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

    let photoPath = currentStaff.photo

    if (photoFile && photoFile.name && photoFile.size > 0) {
      // Delete old photo if it exists
      if (currentStaff.photo) {
        try {
          const oldPhotoPath = path.join(process.cwd(), "public", currentStaff.photo)
          await unlink(oldPhotoPath)
        } catch (error) {
          console.log("Could not delete old photo:", error)
        }
      }

      // Upload new photo
      const bytes = await photoFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filename = `${Date.now()}-${photoFile.name.replace(/\s+/g, "_")}`

      const uploadDir = path.join(process.cwd(), "public", "staff")
      await mkdir(uploadDir, { recursive: true })

      const filePath = path.join(uploadDir, filename)
      await writeFile(filePath, buffer)
      photoPath = `/staff/${filename}`
    }

    // Start transaction to update both staff and admin records
    const result = await prisma.$transaction(async (tx) => {
      // Update staff record
      const updatedStaff = await tx.staff.update({
        where: { id },
        data: {
          name,
          role,
          phone,
          email: email || null,
          photo: photoPath,
          status,
          joinedAt: new Date(joinedAt),
        },
        include: {
          attendance: { orderBy: { date: "desc" }, take: 30 },
          _count: {
            select: { attendance: true },
          },
        },
      })

      // Handle admin record updates
      let adminUpdate = null
      let newPassword = null

      if (email) {
        // Find existing admin record by old email
        const existingAdmin = await tx.admin.findFirst({
          where: { email: currentStaff.email || email },
        })

        if (existingAdmin) {
          // Update existing admin record
          adminUpdate = await tx.admin.update({
            where: { id: existingAdmin.id },
            data: {
              name,
              email,
              role: role.toLowerCase(),
            },
          })
        } else {
          // Create new admin record if email is newly added
          newPassword = generatePassword({
            name,
            role,
            phone,
            joinedAt,
          })
          
          const hashedPassword = await hashPassword(newPassword)
          
          adminUpdate = await tx.admin.create({
            data: {
              name,
              email,
              password: hashedPassword,
              role: role.toLowerCase(),
            },
          })
        }
      } else if (currentStaff.email) {
        // Remove admin record if email is removed
        await tx.admin.deleteMany({
          where: { email: currentStaff.email },
        })
      }

      return { staff: updatedStaff, admin: adminUpdate, newPassword }
    })

    // Define a type for staff with attendance and count, and add loginCredentials
    type StaffWithAttendance = typeof result.staff;
    type StaffResponse = StaffWithAttendance & {
      loginCredentials?: {
        email: string;
        password: string;
        message: string;
      };
    };

    const response: StaffResponse = { ...result.staff };

    if (result.newPassword) {
      response.loginCredentials = {
        email,
        password: result.newPassword,
        message: "New login credentials have been generated"
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating staff:", error)
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params
    const id = Number.parseInt(idParam)

    // Get staff data for photo cleanup and admin record removal
    const staff = await prisma.staff.findUnique({
      where: { id },
    })

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Start transaction to delete both staff and admin records
    await prisma.$transaction(async (tx) => {
      // Delete attendance records first (cascade)
      await tx.staffAttendance.deleteMany({
        where: { staffId: id },
      })

      // Delete admin record if exists
      if (staff.email) {
        await tx.admin.deleteMany({
          where: { email: staff.email },
        })
      }

      // Delete staff member
      await tx.staff.delete({
        where: { id },
      })
    })

    // Delete photo file if it exists
    if (staff.photo) {
      try {
        const photoPath = path.join(process.cwd(), "public", staff.photo)
        await unlink(photoPath)
      } catch (error) {
        console.log("Could not delete photo file:", error)
      }
    }

    return NextResponse.json({ message: "Staff member and associated login credentials deleted successfully" })
  } catch (error) {
    console.error("Error deleting staff:", error)
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 })
  }
}
