"use client"
import { useEffect, useState } from "react"

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
  const [selectedContact, setSelectedContact] = useState<CustomerContact | null>(null)
  const [status, setStatus] = useState("")

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

  const handleSend = async () => {
    if (!selectedContact || !message.trim()) return
    setStatus("Sending...")
    try {
      const res = await fetch("/api/v1/sendmessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactNo: selectedContact.contactNo,
          message,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus("Message sent!")
        setMessage("")
      } else {
        setStatus("Failed: " + (data.error || "Unknown error"))
      }
    } catch  {
      setStatus("Failed to send message")
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
                <th className="p-3 font-semibold text-gray-600">Contact No</th>
                <th className="p-3 font-semibold text-gray-600">Email</th>
                <th className="p-3 font-semibold text-gray-600">Created At</th>
                <th className="p-3 font-semibold text-gray-600">Select</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-b border-gray-100">
                  <td className="p-3">{contact.contactNo || "-"}</td>
                  <td className="p-3">{contact.email || "-"}</td>
                  <td className="p-3">{new Date(contact.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <button
                      className={`px-3 py-1 rounded ${selectedContact?.id === contact.id ? "bg-amber-500 text-white" : "bg-gray-100"}`}
                      onClick={() => setSelectedContact(contact)}
                    >
                      {selectedContact?.id === contact.id ? "Selected" : "Select"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mb-4">
            <textarea
              className="w-full p-3 border border-gray-300 rounded-xl"
              rows={3}
              placeholder="Type your message to share with customer..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!selectedContact}
            />
          </div>
          <button
            className="bg-amber-500 text-white px-4 py-2 rounded-xl"
            onClick={handleSend}
            disabled={!selectedContact || !message.trim()}
          >
            Send Message
          </button>
          {status && <div className="mt-2 text-green-600">{status}</div>}
        </div>
      )}
    </div>
  )
}
