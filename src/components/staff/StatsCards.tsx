"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, CheckCircle, Clock, XCircle } from "lucide-react"
import { format } from "date-fns"

interface Staff {
  id: number
  name: string
  role: string
  phone: string
  email?: string
  photo?: string
  status: string
  joinedAt: string
  attendance: Attendance[]
}

interface Attendance {
  id: number
  date: string
  checkIn?: string
  checkOut?: string
  status: string
}

interface StatsCardsProps {
  staffList: Staff[]
}

export default function StatsCards({ staffList }: StatsCardsProps) {
  const getTodayAttendance = (staff: Staff) => {
    const today = format(new Date(), "yyyy-MM-dd")
    return staff.attendance.find((a) => a.date.startsWith(today))
  }

  const stats = {
    total: staffList.length,
    active: staffList.filter((s) => s.status === "Active").length,
    presentToday: staffList.filter((s) => getTodayAttendance(s)?.status === "Present").length,
    absentToday: staffList.filter((s) => !getTodayAttendance(s) || getTodayAttendance(s)?.status === "Absent").length,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Staff</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Present Today</p>
              <p className="text-2xl font-bold">{stats.presentToday}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">Absent Today</p>
              <p className="text-2xl font-bold">{stats.absentToday}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
