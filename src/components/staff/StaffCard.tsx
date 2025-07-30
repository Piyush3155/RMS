"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Trash2, Clock, Calendar, Phone, Mail, Key, MoreVertical } from "lucide-react"
import { format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

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
    const today = format(new Date(), "yyyy-MM-dd")
    return staff.attendance.find((a) => a.date.startsWith(today))
  }

  const getAttendanceStats = () => {
    const total = staff.attendance.length
    const present = staff.attendance.filter((a) => a.status === "Present").length
    const absent = staff.attendance.filter((a) => a.status === "Absent").length
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0
    return { total, present, absent, attendanceRate }
  }

  const todayAttendance = getTodayAttendance()
  const stats = getAttendanceStats()
  const isCheckedIn = todayAttendance?.checkIn && !todayAttendance?.checkOut

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-14 w-14 ring-2 ring-background shadow-md">
                <AvatarImage 
                  src={staff.photo || "/placeholder.svg?height=56&width=56"} 
                  alt={staff.name}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                  {staff.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                isCheckedIn ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">{staff.name}</CardTitle>
              <p className="text-sm text-blue-600 font-medium">{staff.role}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={staff.status === "Active" ? "default" : "secondary"}
                  className={staff.status === "Active" ? "bg-green-100 text-green-800" : ""}
                >
                  {staff.status}
                </Badge>
                {staff.email && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    <Key className="h-3 w-3 mr-1" />
                    Login
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
      
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{staff.phone}</span>
          </div>
          {staff.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span className="truncate">{staff.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Joined {format(new Date(staff.joinedAt), "MMM dd, yyyy")}</span>
          </div>
        </div>

        <Separator />

        {/* Attendance Stats */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
            <span className="text-sm font-bold text-gray-900">{stats.attendanceRate}%</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white rounded-md p-2">
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-semibold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-md p-2">
              <p className="text-xs text-gray-500">Present</p>
              <p className="font-semibold text-green-600">{stats.present}</p>
            </div>
            <div className="bg-white rounded-md p-2">
              <p className="text-xs text-gray-500">Absent</p>
              <p className="font-semibold text-red-600">{stats.absent}</p>
            </div>
          </div>
        </div>

        {/* Today's Status */}
        <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${
          isCheckedIn 
            ? 'bg-green-50 border-green-200' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div>
            <span className="text-sm font-medium text-gray-700">Today&apos;s Status</span>
            <div className="text-xs text-gray-500">
              {todayAttendance?.checkIn && (
                <span>In: {format(new Date(todayAttendance.checkIn), "hh:mm a")}</span>
              )}
              {todayAttendance?.checkOut && (
                <span className="ml-2">Out: {format(new Date(todayAttendance.checkOut), "hh:mm a")}</span>
              )}
            </div>
          </div>
          <Badge 
            variant={isCheckedIn ? "default" : "outline"}
            className={isCheckedIn ? "bg-green-100 text-green-800" : ""}
          >
            {isCheckedIn ? "Checked In" : "Not Checked In"}
          </Badge>
        </div>

        {/* Action Button */}
        <Button
          variant={isCheckedIn ? "destructive" : "default"}
          onClick={() => (isCheckedIn ? onCheckOut(staff.id) : onCheckIn(staff.id))}
          disabled={checkInLoading === staff.id}
          className="w-full"
          size="lg"
        >
          {checkInLoading === staff.id ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Clock className="h-4 w-4 mr-2" />
          )}
          {isCheckedIn ? "Check Out" : "Check In"}
        </Button>
      </CardContent>
    </Card>
  )
}
