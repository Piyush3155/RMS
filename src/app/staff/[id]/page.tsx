import { prisma } from "@/lib/prisma"
import { format } from "date-fns"

type Props = {
  params: { id: string }
}

export default async function AttendancePage({ params }: Props) {
  const staff = await prisma.staff.findUnique({
    where: { id: parseInt(params.id) },
    include: { attendance: { orderBy: { date: "desc" } } },
  })

  if (!staff) return <div className="p-4">Staff not found</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Attendance: {staff.name}</h1>
      <table className="w-full table-auto border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">Date</th>
            <th className="border px-4 py-2">Check-In</th>
            <th className="border px-4 py-2">Check-Out</th>
            <th className="border px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {staff.attendance.map((a) => (
            <tr key={a.id}>
              <td className="border px-4 py-2">{format(a.date, "yyyy-MM-dd")}</td>
              <td className="border px-4 py-2">{a.checkIn ? format(a.checkIn, "hh:mm a") : "-"}</td>
              <td className="border px-4 py-2">{a.checkOut ? format(a.checkOut, "hh:mm a") : "-"}</td>
              <td className="border px-4 py-2">{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
