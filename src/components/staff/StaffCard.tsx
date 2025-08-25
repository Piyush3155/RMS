"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Trash2, Clock, Calendar, Phone, Mail, Key, MoreVertical } from "lucide-react"
import { format, isToday } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

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
  _count?: {
    attendance: number
  }
}

interface Attendance {
  id: number
  date: string
  checkIn?: string
  checkOut?: string
  status: string
}

interface StaffCardProps {
  staff: Staff
  onEdit: (staff: Staff) => void
  onDelete: (id: number) => void
  onViewAttendance: (staff: Staff) => void
  onCheckIn: (staffId: number) => void
  onCheckOut: (staffId: number) => void
  checkInLoading: number | null
}

export default function StaffCard({
  staff,
  onEdit,
  onDelete,
  onViewAttendance,
  onCheckIn,
  onCheckOut,
  checkInLoading,
}: StaffCardProps) {
  const getTodayAttendance = () => {
    // Use isToday to handle timezone/format reliably
    return staff.attendance.find((a) => isToday(new Date(a.date)))
  }

  const getAttendanceStats = () => {
    const total = staff.attendance.length
    const present = staff.attendance.filter((a) => a.status === "Present").length
    const absent = staff.attendance.filter((a) => a.status === "Absent").length
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0
    return { total, present, absent, attendanceRate }
  }

  const todayAttendance = getTodayAttendance()
  // Consider checked in if checkIn exists and checkOut does NOT exist
  const isCheckedIn = !!todayAttendance?.checkIn && !todayAttendance?.checkOut
  const isCheckedOut = !!todayAttendance?.checkOut

  const stats = getAttendanceStats()

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 ring-2 ring-background shadow-md">
                <AvatarImage 
                  src={staff.photo || "/placeholder.svg?height=64&width=64"} 
                  alt={staff.name}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                  {staff.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                isCheckedIn ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold text-gray-900">{staff.name}</CardTitle>
              <p className="text-sm text-blue-600 font-medium">{staff.role}</p>
              <div className="flex items-center gap-2 pt-1">
                <Badge 
                  variant={staff.status === "Active" ? "default" : "secondary"}
                  className={`text-xs ${staff.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {staff.status}
                </Badge>
                {staff.email && (
                  <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200">
                    <Key className="h-3 w-3 mr-1" />
                    Login Enabled
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(staff)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewAttendance(staff)}>
                <Calendar className="h-4 w-4 mr-2" />
                View Attendance
              </DropdownMenuItem>
              <Separator />
              <DropdownMenuItem 
                onClick={() => onDelete(staff.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-grow">
        {/* Contact Information */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>{staff.phone}</span>
          </div>
          {staff.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="truncate">{staff.email}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>Joined on {format(new Date(staff.joinedAt), "MMM dd, yyyy")}</span>
          </div>
        </div>

        <Separator />

        {/* Attendance Stats */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
            <span className="text-lg font-bold text-blue-600">{stats.attendanceRate}%</span>
          </div>
          <Progress value={stats.attendanceRate} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{stats.present} Present</span>
            <span>{stats.absent} Absent</span>
            <span>{stats.total} Total Days</span>
          </div>
        </div>
      </CardContent>

      {/* Action Area */}
      <div className={`p-4 mt-2 border-t-2 ${
        isCheckedIn 
          ? 'bg-green-50 border-green-200' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {isCheckedIn ? "Checked In" : isCheckedOut ? "Checked Out" : "Not Checked In"}
            </p>
            <p className="text-xs text-gray-500">
              {todayAttendance?.checkIn && !todayAttendance.checkOut && `Since ${format(new Date(todayAttendance.checkIn), "hh:mm a")}`}
              {todayAttendance?.checkOut && `Checked out at ${format(new Date(todayAttendance.checkOut), "hh:mm a")}`}
              {!todayAttendance && "No record for today"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Check In button - only disabled if already checked in and not checked out */}
            <Button
              variant="default"
              onClick={() => onCheckIn(staff.id)}
              disabled={checkInLoading === staff.id || isCheckedIn}
              className="w-32 shadow-md"
              size="sm"
            >
              {checkInLoading === staff.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Check In
                </>
              )}
            </Button>

            {/* Check Out button - only visible when checked in and not checked out */}
            {isCheckedIn && (
              <Button
                variant="destructive"
                onClick={() => onCheckOut(staff.id)}
                disabled={checkInLoading === staff.id}
                className="w-32 shadow-md"
                size="sm"
              >
                {checkInLoading === staff.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Check Out
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

