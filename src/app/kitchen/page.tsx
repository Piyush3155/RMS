"use client"

import { useState, useEffect, ReactNode } from "react"
import { Clock, CheckCircle2, ChefHat, Trash2, Bell, Loader2 } from "lucide-react"

type OrderStatus = "received" | "preparing" | "completed"

interface OrderItem {
  [x: string]: ReactNode
  id: string
  itemName: string
  quantity: number
}

interface Order {
  id: string
  tableNumber: number
  items: OrderItem[]
  status: OrderStatus
  timestamp: string
  chef?: string
  notes?: string
}

// Fetch orders from API
const fetchOrders = async (): Promise<Order[]> => {
  const res = await fetch("/api/v1/kitchenorders")
  if (!res.ok) throw new Error("Failed to fetch orders")
  return res.json()
}

// Helper to sync with localStorage
const saveOrdersToLocal = (orders: Order[]) => {
  localStorage.setItem("kitchenOrders", JSON.stringify(orders))
}

const loadOrdersFromLocal = (): Order[] => {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem("kitchenOrders")
  return data ? JSON.parse(data) : []
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  // Initial load from localStorage
  useEffect(() => {
    const localOrders = loadOrdersFromLocal()
    setOrders(localOrders)
    fetchOrders()
      .then((data) => {
        const sorted = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        setOrders(sorted)
        saveOrdersToLocal(sorted)
        setLoading(false)
      })
      .catch(console.error)

    const interval = setInterval(() => {
      fetchOrders()
        .then((data) => {
          const sorted = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          setOrders(sorted)
          saveOrdersToLocal(sorted)
        })
        .catch(console.error)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Update order status + save to localStorage
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    await fetch(`/api/v1/kitchenorders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })

    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    )
    setOrders(updatedOrders)
    saveOrdersToLocal(updatedOrders)

    // If status is completed, delete the order
    if (newStatus === "completed") {
      await discardOrder(orderId)
    }
  }

  // Delete order from DB + localStorage
  const discardOrder = async (orderId: string) => {
    await fetch(`/api/v1/kitchenorders/${orderId}`, { method: "DELETE" })
    const remainingOrders = orders.filter((order) => order.id !== orderId)
    setOrders(remainingOrders)
    saveOrdersToLocal(remainingOrders)
  }

  const filteredOrders = orders.filter(
    (order) =>
      order.tableNumber.toString().includes(searchQuery) ||
      order.items.some((item) =>
        String(item.itemName).toLowerCase().includes(searchQuery.toLowerCase())
      )
  )

  return (
    <div className="container mx-auto py-6 px-4 text-black bg-[#FFF8E1] min-h-screen">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <ChefHat className="text-[#FFB300]" />BITE & CO Kitchen
      </h1>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search orders..."
          className="px-3 py-2 border rounded-md text-black bg-[#FFECB3]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center text-xl">
          <Loader2 className="animate-spin mx-auto text-[#FFB300]" size={32} />
          Loading orders...
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`border rounded-lg shadow-md overflow-hidden text-black transition ${
                order.status === "received"
                  ? "bg-[#FFF8E1] border-yellow-600"
                  : order.status === "preparing"
                  ? "bg-[#FFE082] border-orange-500"
                  : "bg-[#C5E1A5] border-green-600"
              }`}
            >
              <div className="p-4 border-b bg-[#FFD54F] text-black font-semibold flex justify-between">
                <span>Table #{order.tableNumber}</span>
                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded text-black bg-[#FFD54F]">
                  {order.status}
                </span>
              </div>
              <div className="p-4">
                <table className="w-full border text-black">
                  <thead>
                    <tr className="border">
                      <th className="border px-4 py-2 text-left">Item</th>
                      <th className="border px-4 py-2 text-left">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={`${order.id}-${index}`} className="border">
                        <td className="border px-4 py-2 text-black">{item.itemName}</td>
                        <td className="border px-4 py-2 text-black">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-between mt-4">
                  {order.status === "received" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "preparing")}
                      className="px-4 py-2 rounded-lg shadow-md bg-[#FFB300] text-black hover:bg-[#FFA000] transition"
                    >
                      Start
                    </button>
                  )}
                  {order.status === "preparing" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "completed")}
                      className="px-4 py-2 rounded-lg shadow-md bg-[#C5E1A5] text-black hover:bg-[#AED581] transition"
                    >
                      Complete
                    </button>
                  )}
                  <button
                    onClick={() => discardOrder(order.id)}
                    className="px-4 py-2 rounded-lg shadow-md bg-[#D84315] text-white hover:bg-[#BF360C] transition"
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
