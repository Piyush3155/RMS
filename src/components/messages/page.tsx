"use client"
import { useEffect, useState, useRef } from "react"
import Image from "next/image"

interface CustomerContact {
  id: number
  contactNo?: string
  email?: string
  createdAt: string
}

export default function MessagesPage() {
  const [contacts, setContacts] = useState<CustomerContact[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [selectedContacts, setSelectedContacts] = useState<number[]>([])
  const [status, setStatus] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function fetchContacts() {
      setLoading(true)
      try {
        const res = await fetch("/api/v1/customercontact", { method: "GET" })
        if (res.ok) {
          const data = await res.json()
          setContacts(data.contacts || [])
        }
      } catch {
        setContacts([])
      } finally {
        setLoading(false)
      }
    }
    fetchContacts()
  }, [])

  const handleSelect = (id: number) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0])
    }
  }

  const insertTag = (tag: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = message.substring(0, start)
    const selected = message.substring(start, end)
    const after = message.substring(end)
    let newText = ""
    if (tag === "b") {
      newText = before + "<b>" + selected + "</b>" + after
    } else if (tag === "i") {
      newText = before + "<i>" + selected + "</i>" + after
    } else if (tag === "u") {
      newText = before + "<u>" + selected + "</u>" + after
    }
    setMessage(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + tag.length + 2, end + tag.length + 2 + selected.length)
    }, 0)
  }

  const handleSend = async () => {
    if (selectedContacts.length === 0 || !message.trim()) return
    setStatus("Sending...")
    try {
      const selected = contacts.filter((c) => selectedContacts.includes(c.id))
      const emails = selected
        .map((c) => c.email)
        .filter((email): email is string => typeof email === "string")
      const formData = new FormData()
      formData.append("type", "email")
      formData.append("message", message)
      emails.forEach((email) => formData.append("emails[]", email))
      if (image) formData.append("image", image)
      const res = await fetch("/api/v1/sendbulkmessage", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setStatus("Emails sent!")
        setMessage("")
        setImage(null)
      } else {
        setStatus("Failed: " + (data.error || "Unknown error"))
      }
    } catch {
      setStatus("Failed to send emails")
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Messages</h2>
      {loading ? (
        <div>Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div>No customer contacts found.</div>
      ) : (
        <div>
          <table className="w-full mb-6">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-gray-200">
                <th className="p-3 font-semibold text-gray-600">Select</th>
                <th className="p-3 font-semibold text-gray-600">Contact No</th>
                <th className="p-3 font-semibold text-gray-600">Email</th>
                <th className="p-3 font-semibold text-gray-600">Created At</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-b border-gray-100">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => handleSelect(contact.id)}
                    />
                  </td>
                  <td className="p-3">{contact.contactNo || "-"}</td>
                  <td className="p-3">{contact.email || "-"}</td>
                  <td className="p-3">{new Date(contact.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mb-2 flex gap-2">
            <button
              type="button"
              className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 font-bold"
              onClick={() => insertTag("b")}
              disabled={selectedContacts.length === 0}
            >
              B
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 italic"
              onClick={() => insertTag("i")}
              disabled={selectedContacts.length === 0}
            >
              I
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 underline"
              onClick={() => insertTag("u")}
              disabled={selectedContacts.length === 0}
            >
              U
            </button>
          </div>
          <div className="mb-4">
            <textarea
              ref={textareaRef}
              className="w-full p-3 border border-gray-300 rounded-xl"
              rows={3}
              placeholder="Type your message to share with customer..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={selectedContacts.length === 0}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Attach Image (optional):</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={selectedContacts.length === 0}
            />
            {image && (
              <>
                <Image
                  src={URL.createObjectURL(image)}
                  alt="Preview"
                  width={128}
                  height={128}
                  className="max-h-32 rounded border"
                />
                <button
                  type="button"
                  className="ml-2 text-red-600"
                  onClick={() => setImage(null)}
                >
                  Remove
                </button>
              </>
            )}
          </div>
          <button
            className="bg-amber-500 text-white px-4 py-2 rounded-xl"
            onClick={handleSend}
            disabled={selectedContacts.length === 0 || !message.trim()}
          >
            Send Email Message
          </button>
          {status && <div className="mt-2 text-green-600">{status}</div>}
        </div>
      )}
    </div>
  )
}
