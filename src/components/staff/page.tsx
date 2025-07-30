"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Key, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Import sub-components
import StatsCards from "./StatsCards"
import StaffCard from "./StaffCard"
import StaffForm from "./StaffForm"
import AttendanceModal from "./AttendanceModal"

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
  const [] = useState({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleAddStaff = async (formData: FormData) => {
    try {
      const response = await fetch("/api/v1/staff", {
        method: "POST",
        body: formData,
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

  const handleUpdateStaff = async (formData: FormData) => {
    if (!selectedStaff) return

    try {
      const response = await fetch(`/api/v1/staff/${selectedStaff.id}`, {
        method: "PUT",
        body: formData,
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


  const openEditModal = (staff: Staff) => {
    setSelectedStaff(staff)
    setIsEditModalOpen(true)
  }

  const openAttendanceModal = (staff: Staff) => {
    setSelectedStaff(staff)
    setIsAttendanceModalOpen(true)
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
          <StaffForm
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={handleAddStaff}
            title="Add New Staff Member"
          />
        </Dialog>
      </div>

      {/* Stats Cards */}
      <StatsCards staffList={staffList} />

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.map((staff) => (
          <StaffCard
            key={staff.id}
            staff={staff}
            onEdit={openEditModal}
            onDelete={handleDeleteStaff}
            onViewAttendance={openAttendanceModal}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            checkInLoading={checkInLoading}
          />
        ))}
      </div>

      {/* Edit Modal */}
      <StaffForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateStaff}
        staff={selectedStaff}
        title="Edit Staff Member"
      />

      {/* Attendance Modal */}
      <AttendanceModal
        staff={selectedStaff}
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
      />
    </div>
  )
}
                 