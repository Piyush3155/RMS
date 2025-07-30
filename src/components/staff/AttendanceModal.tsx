"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, TrendingUp, TrendingDown } from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"

interface Staff {
  id: number
  name: string
  role: string
  attendance: Attendance[]
}

interface Attendance {
  id: number
  date: string
  checkIn?: string
  checkOut?: string
  status: string
}

interface AttendanceModalProps {
  staff: Staff | null
  isOpen: boolean
  onClose: () => void
}

export default function AttendanceModal({ staff, isOpen, onClose }: AttendanceModalProps) {
  if (!staff) return null

  const getAttendanceStats = () => {
    const total = staff.attendance.length
    const present = staff.attendance.filter((a) => a.status === "Present").length
    const absent = staff.attendance.filter((a) => a.status === "Absent").length
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0
    
    // Calculate average hours
    const workingDays = staff.attendance.filter(a => a.checkIn && a.checkOut)
    const totalHours = workingDays.reduce((sum, record) => {
      if (record.checkIn && record.checkOut) {
        const checkIn = new Date(record.checkIn)
        const checkOut = new Date(record.checkOut)
        return sum + (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
      }
      return sum
    }, 0)
    const avgHours = workingDays.length > 0 ? (totalHours / workingDays.length).toFixed(1) : "0"

    return { total, present, absent, attendanceRate, avgHours }
  }

  const stats = getAttendanceStats()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5" />
            Attendance History - {staff.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Days</p>
                    <p className="text-xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Attendance Rate</p>
                    <p className="text-xl font-bold text-green-600">{stats.attendanceRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Hours</p>
                    <p className="text-xl font-bold">{stats.avgHours}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Absent Days</p>
                    <p className="text-xl font-bold text-red-600">{stats.absent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Day</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Check In</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Check Out</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Hours</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.attendance
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((record, index) => {
                      const date = new Date(record.date)
                      const checkIn = record.checkIn ? new Date(record.checkIn) : null
                      const checkOut = record.checkOut ? new Date(record.checkOut) : null
                      const hours = checkIn && checkOut 
                        ? ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(1)
                        : "-"

                      return (
                        <tr 
                          key={record.id} 
                          className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                        >
                          <td className="p-4 font-medium">
                            {format(date, "MMM dd, yyyy")}
                          </td>
                          <td className="p-4 text-gray-600">
                            {format(date, "EEEE")}
                          </td>
                          <td className="p-4">
                            {checkIn ? (
                              <span className="text-green-600 font-medium">
                                {format(checkIn, "hh:mm a")}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            {checkOut ? (
                              <span className="text-red-600 font-medium">
                                {format(checkOut, "hh:mm a")}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-4 font-medium">
                            {hours !== "-" ? `${hours}h` : "-"}
                          </td>
                          <td className="p-4">
                            <Badge 
                              variant={record.status === "Present" ? "default" : "destructive"}
                              className={record.status === "Present" ? "bg-green-100 text-green-800" : ""}
                            >
                              {record.status}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
