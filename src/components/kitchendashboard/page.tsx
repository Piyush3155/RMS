
import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { ChefHat, Trash2, Loader2, Clock, CheckCircle, AlertCircle, MoreHorizontal, RefreshCw, CookingPot } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type OrderStatus = "received" | "preparing" | "completed" | "pending"

interface OrderItem {
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

const fetchOrders = async (): Promise<Order[]> => {
  const res = await fetch("/api/v1/kitchenorders")
  if (!res.ok) throw new Error("Failed to fetch orders")
  return res.json()
}

const updateOrderStatusAPI = async (orderId: string, newStatus: OrderStatus) => {
  const res = await fetch(`/api/v1/kitchenorders/${orderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  })
  if (!res.ok) throw new Error("Failed to update order status")
  return res.json()
}

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all")
  const [currentDate, setCurrentDate] = useState<string>("")

  console.log("Current Date:", currentDate)
  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    )

    loadOrders()

    const interval = setInterval(() => {
      loadOrders(false)
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const loadOrders = (showLoading = true) => {
    if (showLoading) setLoading(true)
    fetchOrders()
      .then((data) => {
        setOrders(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
        setLoading(false)
      })
      .catch((error) => {
        console.error(error)
        setLoading(false)
        toast.error("Failed to fetch kitchen orders")
      })
  }

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatusAPI(orderId, newStatus)
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)),
      )
      toast.success(`Order marked as ${newStatus}`)
    } catch (error) {
      console.error(error)
      toast.error("Failed to update order status")
    }
  }

  const discardOrder = async (orderId: string) => {
    try {
      await fetch(`/api/v1/kitchenorders/${orderId}`, { method: "DELETE" })
      setOrders(orders.filter((order) => order.id !== orderId))
      toast.info("Order deleted")
    } catch {
      toast.error("Failed to delete order")
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-700">
            New
          </Badge>
        )
      case "received":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-700">
            Received
          </Badge>
        )
      case "preparing":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-700">
            Preparing
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700">
            Completed
          </Badge>
        )
    }
  }

  const filteredOrders = activeTab === "all" ? orders : orders.filter((order) => order.status === activeTab)

  const getOrderCount = (status: OrderStatus | "all") => {
    if (status === "all") return orders.length
    return orders.filter((order) => order.status === status).length
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CookingPot className="text-amber-500" size={24} />
          Order Status
        </h2>
        <button
          onClick={() => loadOrders()}
          className="bg-amber-100 text-amber-600 px-4 py-2 rounded-xl hover:bg-amber-200 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={(value: string) => setActiveTab(value as OrderStatus | "all")}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 mb-6 shadow-md rounded-lg bg-white border border-slate-200">
          <TabsTrigger value="all">All ({getOrderCount("all")})</TabsTrigger>
          <TabsTrigger value="pending">
            <Clock className="w-4 h-4 mr-2" /> New ({getOrderCount("pending")})
          </TabsTrigger>
          <TabsTrigger value="preparing">
            <AlertCircle className="w-4 h-4 mr-2" /> In Progress ({getOrderCount("preparing")})
          </TabsTrigger>
          <TabsTrigger value="completed">
            <CheckCircle className="w-4 h-4 mr-2" /> Completed ({getOrderCount("completed")})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="text-center p-12">
              <Loader2 className="animate-spin mx-auto text-amber-500 mb-4" size={48} />
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center p-12 bg-gray-50 rounded-lg border shadow-sm">
              <ChefHat className="mx-auto text-amber-500 mb-4" size={48} />
              <p className="text-xl font-medium">No orders found</p>
              <p className="text-gray-500 mt-2">
                {activeTab === "all"
                  ? "The kitchen is quiet right now. Time to prep!"
                  : `No ${activeTab} orders at the moment.`}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  className={`
                  overflow-hidden
                  ${order.status === "pending" ? "border-l-4 border-l-slate-400" : ""}
                  ${order.status === "received" ? "border-l-4 border-l-amber-400" : ""}
                  ${order.status === "preparing" ? "border-l-4 border-l-orange-400" : ""}
                  ${order.status === "completed" ? "border-l-4 border-l-green-400" : ""}
                `}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">Table #{order.tableNumber}</CardTitle>
                        <span className="text-xs text-gray-500">{formatTime(order.timestamp)}</span>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item, index) => (
                          <TableRow key={`${order.id}-${index}`}>
                            <TableCell>{item.itemName}</TableCell>
                            <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {order.notes && (
                      <div className="mt-3 p-2 bg-slate-50 rounded-md text-sm italic">
                        <span className="font-medium">Notes:</span> {order.notes}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-4">
                      <div>
                        {order.status === "pending" && (
                          <Button
                            onClick={() => handleUpdateStatus(order.id, "preparing")}
                            className="flex items-center gap-1"
                            variant="default"
                          >
                            <AlertCircle className="w-4 h-4 mr-1" /> Start Preparing
                          </Button>
                        )}
                        {order.status === "preparing" && (
                          <Button
                            onClick={() => handleUpdateStatus(order.id, "completed")}
                            className="flex items-center gap-1"
                            variant="default"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Mark Complete
                          </Button>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => discardOrder(order.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
