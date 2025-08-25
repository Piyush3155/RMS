"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Key, User, Phone, Mail, Calendar, Camera, Loader2, Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
}

interface StaffFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: FormData) => Promise<void>
  staff?: Staff | null
  title: string
}

interface StaffFormData {
  name: string
  role: string
  phone: string
  email: string
  status: string
  joinedAt: string
  photo: File | null
}

export default function StaffForm({ isOpen, onClose, onSubmit, staff, title }: StaffFormProps) {
  const [formData, setFormData] = useState<StaffFormData>({
    name: staff?.name || "",
    role: staff?.role || "",
    phone: staff?.phone || "",
    email: staff?.email || "",
    status: staff?.status || "Active",
    joinedAt: staff?.joinedAt ? staff.joinedAt.split("T")[0] : "",
    photo: null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const form = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        form.append(key, value as string | File)
      }
    })

    try {
      await onSubmit(form)
      resetForm()
      onClose()
    } catch (error) {
      console.error("Form submission error:", error)
    } finally {
      setIsSubmitting(false)
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

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <User className="h-5 w-5 text-accent" />
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-0 shadow-sm bg-card/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-accent" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-semibold">
                    Role *
                  </Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., Waiter, Chef, Manager"
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email for login access"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="joinedAt" className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Joining Date *
                  </Label>
                  <Input
                    id="joinedAt"
                    type="date"
                    value={formData.joinedAt}
                    onChange={(e) => setFormData({ ...formData, joinedAt: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold">
                    Employment Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label htmlFor="photo" className="text-sm font-semibold flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Profile Photo
                </Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
                      className="h-11"
                    />
                  </div>
                  {formData.photo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Upload className="h-4 w-4" />
                      {formData.photo.name}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {formData.email && (
            <Alert className="border-accent/20 bg-accent/5">
              <Key className="h-4 w-4 text-accent" />
              <AlertDescription className="text-accent/80">
                <strong>Login Access:</strong>{" "}
                {staff
                  ? "Updating the email will generate new login credentials for this staff member."
                  : "Login credentials will be automatically generated and displayed after saving."}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleClose} className="min-w-24 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-32">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {staff ? "Updating..." : "Adding..."}
                </>
              ) : (
                <>{staff ? "Update Staff" : "Add Staff"}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
