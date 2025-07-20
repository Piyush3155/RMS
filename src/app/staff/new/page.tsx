"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AddStaffPage() {
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [joinedAt, setJoinedAt] = useState("")
  const [status, setStatus] = useState("Active")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  const formData = new FormData()
  formData.append("name", name)
  formData.append("role", role)
  formData.append("phone", phone)
  formData.append("email", email)
  formData.append("status", status)
  formData.append("joinedAt", joinedAt)
  if (photo) {
    formData.append("photo", photo)
  }

  await fetch("/api/v1/addstaff", {
    method: "POST",
    body: formData,
  })

  router.push("/staff")
}


  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-xl space-y-4 bg-white dark:bg-gray-900 shadow rounded-md">
      <h1 className="text-xl font-bold">Add New Staff</h1>

      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div>
        <Label htmlFor="role">Role (Waiter, Chef, etc.)</Label>
        <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} required />
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>

      <div>
        <Label htmlFor="email">Email (optional)</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div>
        <Label htmlFor="photo">Photo (optional)</Label>
        <Input
          id="photo"
          type="file"
          accept="image/jpeg, image/jpg, image/png"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setPhoto(file);
            }
          }}
        />
      </div>


      <div>
        <Label htmlFor="joinedAt">Joining Date</Label>
        <Input
          id="joinedAt"
          type="date"
          value={joinedAt}
          onChange={(e) => setJoinedAt(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <Button type="submit" className="w-full mt-4">Save Staff</Button>
    </form>
  )
}
