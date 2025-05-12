"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"  // Import useSearchParams
import { toast } from "react-toastify"
import { ChefHat, Trash2, Loader2, Clock, CheckCircle, AlertCircle, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"

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

import { Suspense } from "react"

function KitchenPageContent() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all")
  const [currentDate, setCurrentDate] = useState<string>("")
  const searchParams = useSearchParams()  // Hook to get query params

  useEffect(() => {
    const error = searchParams.get("error") // Get the 'error' query param
    if (error === "access-denied") {
      toast.error("You don't have access to this page")  // Show error toast
    }

    setCurrentDate(
      new Date().toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    )

    fetchOrders()
      .then((data) => {
        setOrders(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
        setLoading(false)
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
  }, [searchParams])

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
    <div className="container mx-auto py-6 px-4 min-h-screen">
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Image src="/biteandco.png" alt="Logo" width={50} height={50} className="w-20 h-20"/>
          </h1>
          <div className="text-sm text-muted-foreground">{currentDate}</div>
        </div>

        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={(value: string) => setActiveTab(value as OrderStatus | "all")}
        >
          <TabsList className="grid grid-cols-4 mb-8 shadow-lg rounded-lg bg-white border border-slate-200">
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
              <div className="text-center p-12 bg-white rounded-lg border shadow-sm">
                <ChefHat className="mx-auto text-amber-500 mb-4" size={48} />
                <p className="text-xl font-medium">No orders found</p>
                <p className="text-muted-foreground mt-2">
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
                          <span className="text-xs text-muted-foreground">{formatTime(order.timestamp)}</span>
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
                              className="text-destructive focus:text-destructive"
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
      </header>
    </div>
  )
}

export default function KitchenPage() {
  return (
    <Suspense fallback={<div className="text-center p-12"><Loader2 className="animate-spin mx-auto text-amber-500 mb-4" size={48} /><p className="text-muted-foreground">Loading kitchen...</p></div>}>
      <KitchenPageContent />
    </Suspense>
  )
}

