"use client"

import type React from "react"

import { useState, useEffect, type ReactNode } from "react"
import { ChefHat, Trash2, Loader2, Clock, CheckCircle, AlertCircle } from "lucide-react"

type OrderStatus = "received" | "preparing" | "completed" | "pending"

interface OrderItem {
  [x: string]: ReactNode
  id: string
  name: string
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

// API: Fetch Orders
const fetchOrders = async (): Promise<Order[]> => {
  const res = await fetch("/api/v1/kitchenorders")
  if (!res.ok) throw new Error("Failed to fetch orders")
  return res.json()
}

// API: Update Order Status
const updateOrderStatusAPI = async (orderId: string, newStatus: OrderStatus) => {
  const res = await fetch(`/api/v1/kitchenorders/${orderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  })
  if (!res.ok) throw new Error("Failed to update order status")
  return res.json()
}

const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded text-black ${className}`}>
    {children}
  </span>
)

const Button = ({
  children,
  onClick,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "default" | "outline" | "destructive"
  className?: string
}) => {
  const variantClasses = {
    default: "bg-[#FFB300] text-black hover:bg-[#FFA000] transition",
    outline: "border border-[#FFA000] text-black hover:bg-[#FFD54F] transition",
    destructive: "bg-[#D84315] text-white hover:bg-[#BF360C] transition",
  }

  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg shadow-md ${variantClasses[variant]} ${className}`}>
      {children}
    </button>
  )
}

const Card = ({ children, status }: { children: React.ReactNode; status: OrderStatus }) => {
  const statusColors = {
    pending: "bg-[#E0E0E0] border-gray-500",
    received: "bg-[#FFF8E1] border-yellow-600",
    preparing: "bg-[#FFE082] border-orange-500",
    completed: "bg-[#C5E1A5] border-green-600",
  }
  return (
    <div className={`border rounded-lg shadow-md overflow-hidden text-black transition ${statusColors[status]}`}>
      {children}
    </div>
  )
}

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 border-b bg-[#FFD54F] text-black font-semibold">{children}</div>
)

const Table = ({ children }: { children: React.ReactNode }) => (
  <table className="w-full border text-black">{children}</table>
)

const TableHead = ({ children }: { children: React.ReactNode }) => (
  <th className="border px-4 py-2 text-left">{children}</th>
)

const TableRow = ({ children }: { children: React.ReactNode }) => <tr className="border">{children}</tr>

const TableCell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={`border px-4 py-2 text-black ${className}`}>{children}</td>
)

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all")
  const [currentDate, setCurrentDate] = useState<string>("") // Add state for current date

  useEffect(() => {
    // Set the current date on the client side
    setCurrentDate(new Date().toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" }))

    fetchOrders()
      .then((data) => {
        setOrders(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
        setLoading(false)
        console.log(data)
      })
      .catch(console.error)

    const interval = setInterval(() => {
      fetchOrders()
        .then((data) =>
          setOrders(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())),
        )
        .catch(console.error)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatusAPI(orderId, newStatus)
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)),
      )
    } catch (error) {
      console.error(error)
    }
  }

  const discardOrder = async (orderId: string) => {
    await fetch(`/api/v1/kitchenorders/${orderId}`, { method: "DELETE" })
    setOrders(orders.filter((order) => order.id !== orderId))
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "received":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "preparing":
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const filteredOrders = activeTab === "all" ? orders : orders.filter((order) => order.status === activeTab)

  const getOrderCount = (status: OrderStatus | "all") => {
    if (status === "all") return orders.length
    return orders.filter((order) => order.status === status).length
  }

  return (
    <div className="container mx-auto py-6 px-4 text-black bg-[#FFF8E1] min-h-screen">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ChefHat className="text-[#FFB300]" />
            BITE & CO Kitchen
          </h1>
          <div className="text-sm text-gray-700">
            {currentDate} {/* Use the client-side date */}
          </div>
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2">
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            onClick={() => setActiveTab("all")}
            className="flex items-center gap-1"
          >
            All ({getOrderCount("all")})
          </Button>
          <Button
            variant={activeTab === "received" ? "default" : "outline"}
            onClick={() => setActiveTab("pending")}
            className="flex items-center gap-1"
          >
            <Clock className="w-4 h-4" /> New ({getOrderCount("pending")})
          </Button>
          <Button
            variant={activeTab === "preparing" ? "default" : "outline"}
            onClick={() => setActiveTab("preparing")}
            className="flex items-center gap-1"
          >
            <AlertCircle className="w-4 h-4" /> In Progress ({getOrderCount("preparing")})
          </Button>
          <Button
            variant={activeTab === "completed" ? "default" : "outline"}
            onClick={() => setActiveTab("completed")}
            className="flex items-center gap-1"
          >
            <CheckCircle className="w-4 h-4" /> Completed ({getOrderCount("completed")})
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="text-center text-xl p-12">
          <Loader2 className="animate-spin mx-auto text-[#FFB300] mb-4" size={48} />
          <p>Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-lg shadow-md">
          <ChefHat className="mx-auto text-[#FFB300] mb-4" size={48} />
          <p className="text-xl font-medium">No orders found</p>
          <p className="text-gray-600 mt-2">
            {activeTab === "all"
              ? "The kitchen is quiet right now. Time to prep!"
              : `No ${activeTab} orders at the moment.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <Card key={order.id} status={order.status}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">Table #{order.tableNumber}</span>
                    <span className="text-xs text-gray-700">{formatTime(order.timestamp)}</span>
                  </div>
                  <Badge
                    className={`
                    flex items-center gap-1
                    ${order.status === "pending" ? "bg-[#FFF8E1]" : ""}
                    ${order.status === "preparing" ? "bg-[#FFE082]" : ""}
                    ${order.status === "completed" ? "bg-[#C5E1A5]" : ""}
                  `}
                  >
                    {getStatusIcon(order.status)}
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <div className="p-4">
                <Table>
                  <thead>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                    </TableRow>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <TableRow key={`${order.id}-${index}`}>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>

                {order.notes && (
                  <div className="mt-3 p-2 bg-white bg-opacity-50 rounded text-sm italic">
                    <span className="font-medium">Notes:</span> {order.notes}
                  </div>
                )}

                <div className="flex justify-between items-center mt-4">
                  <div>
                    {order.status === "pending" && (
                      <Button
                        onClick={() => handleUpdateStatus(order.id, "preparing")}
                        className="flex items-center gap-1"
                      >
                        <AlertCircle className="w-4 h-4" /> Start Preparing
                      </Button>
                    )}
                    {order.status === "preparing" && (
                      <Button
                        onClick={() => handleUpdateStatus(order.id, "completed")}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" /> Mark Complete
                      </Button>
                    )}
                  </div>
                  <Button variant="destructive" onClick={() => discardOrder(order.id)} className="flex items-center">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}