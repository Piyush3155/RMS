"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Trash2, Clock, Calendar, Phone, Mail, Key, MoreVertical } from "lucide-react"
import { format, isToday } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-card/50 backdrop-blur-sm overflow-hidden p-0">
        <CardHeader className="pb-2 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-secondary" />

          <div className="flex items-start justify-between pt-1">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
                  <AvatarImage src={staff.photo || "/placeholder.svg?height=64&width=64"} alt={staff.name} />
                  <AvatarFallback className="bg-gradient-to-br from-accent to-secondary text-white font-bold text-sm">
                    {staff.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background shadow-sm flex items-center justify-center ${
                    isCheckedIn ? "bg-green-500" : "bg-gray-400"
                  }`}
                >
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>

              <div className="space-y-1">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{staff.name}</h3>
                  <p className="text-accent font-semibold text-sm">{staff.role}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={staff.status === "Active" ? "default" : "secondary"}
                    className={`text-xs font-medium ${
                      staff.status === "Active"
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        staff.status === "Active" ? "bg-green-500" : "bg-gray-500"
                      }`}
                    />
                    {staff.status}
                  </Badge>

                  {staff.email && (
                    <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
                      <Key className="h-4 w-4 mr-1" />
                      Login Access
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-accent/10"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(staff)} className="cursor-pointer">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewAttendance(staff)} className="cursor-pointer">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Attendance
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(staff.id)}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Staff
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Phone className="h-4 w-4 text-accent" />
              </div>
              <span className="font-medium">{staff.phone}</span>
            </div>

            {staff.email && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-accent" />
                </div>
                <span className="font-medium truncate">{staff.email}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-accent" />
              </div>
              <span className="font-medium">Joined {format(new Date(staff.joinedAt), "MMM dd, yyyy")}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-foreground">Attendance Performance</span>
              <div className="text-right">
                <span className="text-xl font-bold text-accent">{stats.attendanceRate}%</span>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>

            <Progress value={stats.attendanceRate} className="h-2" />

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-50 rounded-lg p-1">
                <p className="text-lg font-bold text-green-700">{stats.present}</p>
                <p className="text-xs text-green-600">Present</p>
              </div>
              <div className="bg-red-50 rounded-lg p-1">
                <p className="text-lg font-bold text-red-700">{stats.absent}</p>
                <p className="text-xs text-red-600">Absent</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-1">
                <p className="text-lg font-bold text-blue-700">{stats.total}</p>
                <p className="text-xs text-blue-600">Total</p>
              </div>
            </div>
          </div>
        </CardContent>

        <div
          className={`p-3 border-t transition-colors duration-200 ${
            isCheckedIn
              ? "bg-green-50/50 border-green-200"
              : isCheckedOut
                ? "bg-blue-50/50 border-blue-200"
                : "bg-gray-50/50 border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  isCheckedIn ? "bg-green-500 animate-pulse" : isCheckedOut ? "bg-blue-500" : "bg-gray-400"
                }`}
              />
              <div>
                <p className="text-sm font-semibold">
                  {isCheckedIn ? "Currently Working" : isCheckedOut ? "Shift Completed" : "Not Checked In"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {todayAttendance?.checkIn &&
                    !todayAttendance.checkOut &&
                    `Since ${format(new Date(todayAttendance.checkIn), "hh:mm a")}`}
                  {todayAttendance?.checkOut && `Completed at ${format(new Date(todayAttendance.checkOut), "hh:mm a")}`}
                  {!todayAttendance && "No activity today"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={isCheckedIn ? "secondary" : "default"}
              onClick={() => onCheckIn(staff.id)}
              disabled={checkInLoading === staff.id || isCheckedIn}
              className="flex-1 h-8"
              size="sm"
            >
              {checkInLoading === staff.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Check In
                </>
              )}
            </Button>

            {isCheckedIn && (
              <Button
                variant="outline"
                onClick={() => onCheckOut(staff.id)}
                disabled={checkInLoading === staff.id}
                className="flex-1 h-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                size="sm"
              >
                {checkInLoading === staff.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
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
      </Card>
    </motion.div>
  )
}
