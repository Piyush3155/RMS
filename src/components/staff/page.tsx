"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Edit, Trash2, Clock, CheckCircle, XCircle, Users, Calendar, Phone, Mail, Key, Copy } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hook/use-toast"

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
  loginCredentials?: {
    email: string
    password: string
    message: string
  }
}

interface Attendance {
  id: number
  date: string
  checkIn?: string
  checkOut?: string
  status: string
}

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [checkInLoading, setCheckInLoading] = useState<number | null>(null)
  const [showCredentials, setShowCredentials] = useState<{ email: string; password: string } | null>(null)
  const { toast } = useToast()

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    status: "Active",
    joinedAt: "",
    photo: null as File | null,
  })

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/v1/staff")
      const data = await response.json()
      setStaffList(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch staff data",
        variant: "destructive",
      })
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Copied to clipboard",
    })
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields on client side
    if (!formData.name || !formData.role || !formData.phone || !formData.joinedAt) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const form = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        form.append(key, value as string | File)
      }
    })

    try {
      const response = await fetch("/api/v1/staff", {
        method: "POST",
        body: form,
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Staff member added successfully",
        })

        // Show login credentials if generated
        if (data.loginCredentials) {
          setShowCredentials({
            email: data.loginCredentials.email,
            password: data.loginCredentials.password,
          })
        }

        setIsAddModalOpen(false)
        resetForm()
        fetchStaff()
      } else {
        // Show specific error message
        toast({
          title: "Error",
          description: data.error || "Failed to add staff member",
          variant: "destructive",
        })
        console.error("API Error:", data)
      }
    } catch (error) {
      console.error("Network Error:", error)
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaff) return

    const form = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) {
        form.append(key, value as string | File)
      }
    })

    try {
      const response = await fetch(`/api/v1/staff/${selectedStaff.id}`, {
        method: "PUT",
        body: form,
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Staff member updated successfully",
        })

        // Show login credentials if newly generated
        if (data.loginCredentials) {
          setShowCredentials({
            email: data.loginCredentials.email,
            password: data.loginCredentials.password,
          })
        }

        setIsEditModalOpen(false)
        resetForm()
        fetchStaff()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update staff member",
        variant: "destructive",
      })
      console.log(error)
    }
  }

  const handleDeleteStaff = async (id: number) => {
    if (!confirm("Are you sure you want to delete this staff member? This will also remove their login credentials."))
      return

    try {
      const response = await fetch(`/api/v1/staff/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Staff member deleted successfully",
        })
        fetchStaff()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete staff member",
        variant: "destructive",
      })
      console.log(error)
    }
  }

  const handleCheckIn = async (staffId: number) => {
    setCheckInLoading(staffId)
    try {
      const response = await fetch("/api/v1/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Checked in successfully",
        })
        fetchStaff()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to check in",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check in",
        variant: "destructive",
      })
      console.log(error)
    } finally {
      setCheckInLoading(null)
    }
  }

  const handleCheckOut = async (staffId: number) => {
    setCheckInLoading(staffId)
    try {
      const response = await fetch("/api/v1/attendance/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Checked out successfully",
        })
        fetchStaff()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to check out",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check out",
        variant: "destructive",
      })
      console.log(error)
    } finally {
      setCheckInLoading(null)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      phone: "",
      email: "",
      status: "Active",
      joinedAt: "",
      photo: null,
    })
  }

  const openEditModal = (staff: Staff) => {
    setSelectedStaff(staff)
    setFormData({
      name: staff.name,
      role: staff.role,
      phone: staff.phone,
      email: staff.email || "",
      status: staff.status,
      joinedAt: staff.joinedAt.split("T")[0],
      photo: null,
    })
    setIsEditModalOpen(true)
  }

  const openAttendanceModal = (staff: Staff) => {
    setSelectedStaff(staff)
    setIsAttendanceModalOpen(true)
  }

  const getTodayAttendance = (staff: Staff) => {
    const today = format(new Date(), "yyyy-MM-dd")
    return staff.attendance.find((a) => a.date.startsWith(today))
  }

  const getAttendanceStats = (staff: Staff) => {
    const total = staff.attendance.length
    const present = staff.attendance.filter((a) => a.status === "Present").length
    const absent = staff.attendance.filter((a) => a.status === "Absent").length
    return { total, present, absent }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Login Credentials Modal */}
      <Dialog open={!!showCredentials} onOpenChange={() => setShowCredentials(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Login Credentials Generated
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Login credentials have been automatically generated for this staff member. Please save these details
                securely.
              </AlertDescription>
            </Alert>
            <div className="space-y-3">
              <div>
                <Label>Email</Label>
                <div className="flex items-center gap-2">
                  <Input value={showCredentials?.email || ""} readOnly />
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(showCredentials?.email || "")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>Password</Label>
                <div className="flex items-center gap-2">
                  <Input value={showCredentials?.password || ""} readOnly />
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(showCredentials?.password || "")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Password Format:</strong>
              </p>
              <ul className="list-disc list-inside mt-1">
                <li>First letter of name (uppercase)</li>
                <li>First letter of role (lowercase)</li>
                <li>2 numbers from phone/date</li>
                <li>1 special character</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">Manage your team and track attendance</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., Waiter, Chef"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email (for login)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Auto-generates password"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="joinedAt">Joining Date *</Label>
                  <Input
                    id="joinedAt"
                    type="date"
                    value={formData.joinedAt}
                    onChange={(e) => setFormData({ ...formData, joinedAt: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="photo">Photo</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
                />
              </div>
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  If you provide an email, login credentials will be automatically generated based on personal details.
                </AlertDescription>
              </Alert>
              <Button type="submit" className="w-full">
                Add Staff Member
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{staffList.length}</p>
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
                <p className="text-2xl font-bold">{staffList.filter((s) => s.status === "Active").length}</p>
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
                <p className="text-2xl font-bold">
                  {staffList.filter((s) => getTodayAttendance(s)?.status === "Present").length}
                </p>
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
                <p className="text-2xl font-bold">
                  {staffList.filter((s) => !getTodayAttendance(s) || getTodayAttendance(s)?.status === "Absent").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.map((staff) => {
          const todayAttendance = getTodayAttendance(staff)
          const stats = getAttendanceStats(staff)
          const isCheckedIn = todayAttendance?.checkIn && !todayAttendance?.checkOut

          return (
            <Card key={staff.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={staff.photo || "/placeholder.svg?height=48&width=48"} />
                      <AvatarFallback>
                        {staff.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{staff.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{staff.role}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={staff.status === "Active" ? "default" : "secondary"}>{staff.status}</Badge>
                    {staff.email && (
                      <Badge variant="outline" className="text-xs">
                        <Key className="h-3 w-3 mr-1" />
                        Login
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{staff.phone}</span>
                  </div>
                  {staff.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{staff.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {format(new Date(staff.joinedAt), "MMM dd, yyyy")}</span>
                  </div>
                </div>

                {/* Attendance Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold">{stats.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Present</p>
                    <p className="font-semibold text-green-600">{stats.present}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Absent</p>
                    <p className="font-semibold text-red-600">{stats.absent}</p>
                  </div>
                </div>

                {/* Today's Status */}
                <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Today:</span>
                  <Badge variant={isCheckedIn ? "default" : "outline"}>
                    {isCheckedIn ? "Checked In" : "Not Checked In"}
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={isCheckedIn ? "destructive" : "default"}
                    onClick={() => (isCheckedIn ? handleCheckOut(staff.id) : handleCheckIn(staff.id))}
                    disabled={checkInLoading === staff.id}
                    className="flex-1"
                  >
                    {checkInLoading === staff.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 mr-1" />
                        {isCheckedIn ? "Check Out" : "Check In"}
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openAttendanceModal(staff)}>
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEditModal(staff)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeleteStaff(staff.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateStaff} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Input
                  id="edit-role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-joinedAt">Joining Date</Label>
                <Input
                  id="edit-joinedAt"
                  type="date"
                  value={formData.joinedAt}
                  onChange={(e) => setFormData({ ...formData, joinedAt: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-photo">Photo</Label>
              <Input
                id="edit-photo"
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
              />
            </div>
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>Adding or changing email will generate new login credentials.</AlertDescription>
            </Alert>
            <Button type="submit" className="w-full">
              Update Staff Member
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Attendance Modal */}
      <Dialog open={isAttendanceModalOpen} onOpenChange={setIsAttendanceModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Attendance History - {selectedStaff?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Check In</th>
                  <th className="text-left p-2">Check Out</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Hours</th>
                </tr>
              </thead>
              <tbody>
                {selectedStaff?.attendance.map((record) => {
                  const checkIn = record.checkIn ? new Date(record.checkIn) : null
                  const checkOut = record.checkOut ? new Date(record.checkOut) : null
                  const hours =
                    checkIn && checkOut ? ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(1) : "-"

                  return (
                    <tr key={record.id} className="border-b">
                      <td className="p-2">{format(new Date(record.date), "MMM dd, yyyy")}</td>
                      <td className="p-2">{checkIn ? format(checkIn, "hh:mm a") : "-"}</td>
                      <td className="p-2">{checkOut ? format(checkOut, "hh:mm a") : "-"}</td>
                      <td className="p-2">
                        <Badge variant={record.status === "Present" ? "default" : "destructive"}>{record.status}</Badge>
                      </td>
                      <td className="p-2">{hours}h</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
