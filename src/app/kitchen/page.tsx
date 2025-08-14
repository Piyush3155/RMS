"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "react-toastify"
import { ChefHat, Trash2, Loader2, Clock, CheckCircle, AlertCircle, MoreHorizontal, Utensils, LogOut, Plus, User, Settings, AlertTriangle, Package, Eye } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { Suspense } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"

type OrderStatus = "received" | "preparing" | "completed" | "pending" | "served"

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

interface InventoryItem {
  id: number
  name: string
  unit: string
  quantity: number
}

interface User {
  id: number
  name: string
  role: string
  email?: string
  avatar?: string
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

const fetchInventory = async (): Promise<InventoryItem[]> => {
  const res = await fetch("/api/v1/inventory?type=stock-summary")
  if (!res.ok) throw new Error("Failed to fetch inventory")
  const data = await res.json()
  return data.items || []
}

const deductInventoryForOrder = async (order: Order) => {
  // Call API to deduct inventory based on order items
  await fetch("/api/v1/inventory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "deductStockForOrder",
      orderId: order.id,
      items: order.items,
    }),
  })
}

const fetchUserProfile = async (): Promise<User | null> => {
  try {
    const res = await fetch("/api/v1/cookiename")
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function KitchenPageContent() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all")
  const [currentDate, setCurrentDate] = useState<string>("")
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [showStockUsedModal, setShowStockUsedModal] = useState(false)
  const [stockUsedForm, setStockUsedForm] = useState({
    inventoryItemId: 0,
    quantity: 0,
    note: "",
  })
  const [user, setUser] = useState<User | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showInventoryDialog, setShowInventoryDialog] = useState(false)
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null)
  const [lowStockAlerts, setLowStockAlerts] = useState<InventoryItem[]>([])
  const [showLowStockAlert, setShowLowStockAlert] = useState(false)
  const processedOrdersRef = useRef<Set<string>>(new Set())

  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get("error")
    if (error === "access-denied") {
      toast.error("You don't have access to this page")
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

    fetchInventory()
      .then(setInventory)
      .catch(console.error)

    fetchUserProfile()
      .then(setUser)
      .catch(console.error)

    const checkLowStock = () => {
      const lowStock = inventory.filter(item => item.quantity <= 10) // Items with quantity <= 10 are considered low stock
      if (lowStock.length > 0 && lowStock.length !== lowStockAlerts.length) {
        setLowStockAlerts(lowStock)
        setShowLowStockAlert(true)
        // Auto-hide after 5 seconds
        setTimeout(() => setShowLowStockAlert(false), 5000)
      }
    }

    if (inventory.length > 0) {
      checkLowStock()
    }

    const interval = setInterval(() => {
      fetchOrders()
        .then((data) =>
          setOrders(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())),
        )
        .catch(console.error)
      fetchInventory()
        .then(setInventory)
        .catch(console.error)
    }, 5000)

    return () => clearInterval(interval)
  }, [searchParams, inventory, inventory.length, lowStockAlerts.length])

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatusAPI(orderId, newStatus)
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)),
      )
      // Deduct inventory only when marking as "completed"
      if (newStatus === "completed") {
        const order = orders.find(o => o.id === orderId)
        if (order && !processedOrdersRef.current.has(orderId)) {
          await deductInventoryForOrder(order)
          processedOrdersRef.current.add(orderId)
          fetchInventory().then(setInventory)
        }
        toast.success("Order marked as completed and inventory updated")
      } else if (newStatus === "served") {
        toast.success("Order marked as served")
      } else {
        toast.success(`Order marked as ${newStatus}`)
      }
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

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/v1/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        window.location.href = "/login";
      } else {
        toast.error("Failed to logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">
            New
          </Badge>
        )
      case "received":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
            Received
          </Badge>
        )
      case "preparing":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
            Preparing
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
            Completed
          </Badge>
        )
      case "served":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
            Served
          </Badge>
        )
    }
  }

  const filteredOrders = activeTab === "all" ? orders : orders.filter((order) => order.status === activeTab)

  const getOrderCount = (status: OrderStatus | "all") => {
    if (status === "all") return orders.length
    return orders.filter((order) => order.status === status).length
  }

  async function handleStockUsedSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await fetch("/api/v1/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "stockInOut",
          inventoryItemId: stockUsedForm.inventoryItemId,
          type: "out",
          quantity: stockUsedForm.quantity,
          note: stockUsedForm.note,
        }),
      })
      toast.success("Stock usage recorded")
      setShowStockUsedModal(false)
      setStockUsedForm({ inventoryItemId: 0, quantity: 0, note: "" })
      fetchInventory().then(setInventory)
    } catch {
      toast.error("Failed to record stock usage")
    }
  }

  const openInventoryDetails = (item: InventoryItem) => {
    setSelectedInventoryItem(item)
    setShowInventoryDialog(true)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Low Stock Alert Popup */}
      {showLowStockAlert && lowStockAlerts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <Alert className="bg-red-50 border-red-200 shadow-lg animate-in slide-in-from-right-full duration-500">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <AlertDescription className="text-red-800">
              <div className="font-semibold mb-2">Low Stock Alert!</div>
              <div className="space-y-1 text-sm">
                {lowStockAlerts.slice(0, 3).map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className="font-medium">{item.quantity} {item.unit}</span>
                  </div>
                ))}
                {lowStockAlerts.length > 3 && (
                  <div className="text-xs opacity-70">
                    +{lowStockAlerts.length - 3} more items
                  </div>
                )}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-3 h-7 px-2 text-xs border-red-300 hover:bg-red-100"
                onClick={() => setShowLowStockAlert(false)}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="container mx-auto py-6 px-4">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6 bg-white rounded-2xl p-4 shadow-sm border">
            <div className="flex items-center gap-4">
              <Image src="/biteandco.png" alt="Logo" width={50} height={50} className="w-12 h-12 rounded-lg shadow-md"/>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Kitchen Dashboard</h1>
                <p className="text-sm text-gray-500">{currentDate}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* User Profile Section */}
              {user && (
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-3 hover:bg-slate-100 p-2 rounded-xl">
                        <Avatar className="w-10 h-10 border-2 border-slate-200">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="bg-slate-200 text-slate-700 font-semibold">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-sm">
                      <div className="px-3 py-2 border-b">
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                        <User className="w-4 h-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleLogout}
                        className="text-red-600 focus:text-red-600"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>

          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={(value: string) => setActiveTab(value as OrderStatus | "all")}
          >
            <TabsList className="grid grid-cols-5 mb-8 bg-white shadow-md rounded-xl border p-1">
              <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-slate-900 data-[state=active]:text-white font-semibold">
                All ({getOrderCount("all")})
              </TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-slate-600 data-[state=active]:text-white font-semibold">
                <Clock className="w-4 h-4 mr-2" /> New ({getOrderCount("pending")})
              </TabsTrigger>
              <TabsTrigger value="preparing" className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white font-semibold">
                <AlertCircle className="w-4 h-4 mr-2" /> In Progress ({getOrderCount("preparing")})
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-green-500 data-[state=active]:text-white font-semibold">
                <CheckCircle className="w-4 h-4 mr-2" /> Completed ({getOrderCount("completed")})
              </TabsTrigger>
              <TabsTrigger value="served" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white font-semibold">
                <Utensils className="w-4 h-4 mr-2" /> Served ({getOrderCount("served")})
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
                      overflow-hidden bg-white shadow-md border border-transparent transition-all hover:shadow-lg hover:border-slate-200
                      ${order.status === "pending" ? "border-l-4 border-l-slate-400" : ""}
                      ${order.status === "received" ? "border-l-4 border-l-amber-400" : ""}
                      ${order.status === "preparing" ? "border-l-4 border-l-orange-400" : ""}
                      ${order.status === "completed" ? "border-l-4 border-l-green-400" : ""}
                      ${order.status === "served" ? "border-l-4 border-l-blue-400" : ""}
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
                                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-900"
                                variant="default"
                              >
                                <AlertCircle className="w-4 h-4 mr-1" /> Start Preparing
                              </Button>
                            )}
                            {order.status === "preparing" && (
                              <Button
                                onClick={() => handleUpdateStatus(order.id, "completed")}
                                className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                                variant="default"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" /> Mark Complete
                              </Button>
                            )}
                            {order.status === "completed" && (
                              <>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Ready to be served
                                </Badge>
                                {/* <Button
                                  onClick={() => handleUpdateStatus(order.id, "served")}
                                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 ml-2"
                                  variant="default"
                                >
                                  <Utensils className="w-4 h-4 mr-1" /> Mark as Served
                                </Button> */}
                              </>
                            )}
                            {order.status === "served" && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Served
                              </Badge>
                            )}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {order.status === "completed" && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, "served")}>
                                  <Utensils className="w-4 h-4 mr-2" /> Mark as Served
                                </DropdownMenuItem>
                              )}
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

        {/* Enhanced Inventory Stock Table */}
        <section className="mb-8">
          <Card className="bg-white shadow-lg border rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-800 text-white">
              <CardTitle className="flex items-center justify-between text-xl">
                <div className="flex items-center gap-2">
                  <Package className="w-6 h-6" />
                  <span className="font-bold">Current Inventory Stock</span>
                  {lowStockAlerts.length > 0 && (
                    <Badge className="bg-red-500 text-white ml-2">
                      {lowStockAlerts.length} Low Stock
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 border border-white/30 text-white"
                  onClick={() => setShowStockUsedModal(true)}
                >
                  <Plus size={16} className="mr-2" /> Record Used Stock
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-gray-700">Name</TableHead>
                      <TableHead className="font-semibold text-gray-700">Unit</TableHead>
                      <TableHead className="font-semibold text-gray-700">Quantity</TableHead>
                      <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-400 py-12">
                          <div className="flex flex-col items-center">
                            <ChefHat className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="text-lg font-medium">No inventory items found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      inventory.map((item) => (
                        <TableRow key={item.id} className={`hover:bg-slate-50/50 transition-colors ${
                          item.quantity <= 10 ? 'bg-red-50/50 border-l-4 border-l-red-400' : ''
                        }`}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {item.name}
                              {item.quantity <= 10 && (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">{item.unit}</TableCell>
                          <TableCell>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              item.quantity <= 10 
                                ? 'bg-red-100 text-red-800' 
                                : item.quantity <= 50 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.quantity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openInventoryDetails(item)}
                              className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Profile Modal */}
        <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
          <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">User Profile</DialogTitle>
            </DialogHeader>
            {user && (
              <div className="space-y-6 p-4">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-24 h-24 border-4 border-slate-200">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-slate-200 text-slate-700 text-2xl font-bold">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-800">{user.name}</h3>
                    <p className="text-gray-600 capitalize">{user.role}</p>
                    {user.email && <p className="text-sm text-gray-500">{user.email}</p>}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">User ID</span>
                    <span className="text-gray-600">#{user.id}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Role</span>
                    <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-sm font-medium capitalize">
                      {user.role}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setShowProfileModal(false)} className="bg-slate-800 hover:bg-slate-900">
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Enhanced Stock Used Modal */}
        <Dialog open={showStockUsedModal} onOpenChange={setShowStockUsedModal}>
          <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Record Used Stock</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleStockUsedSubmit} className="space-y-6">
              <div>
                <Label htmlFor="usedItem" className="text-sm font-semibold text-gray-700">Item</Label>
                <Select
                  value={stockUsedForm.inventoryItemId ? stockUsedForm.inventoryItemId.toString() : ""}
                  onValueChange={(value) =>
                    setStockUsedForm({ ...stockUsedForm, inventoryItemId: Number.parseInt(value) })
                  }
                >
                  <SelectTrigger className="mt-1 border-gray-200 focus:border-slate-400 focus:ring-slate-400">
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name} (Current: {item.quantity} {item.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="usedQuantity" className="text-sm font-semibold text-gray-700">Quantity Used</Label>
                <Input
                  id="usedQuantity"
                  type="number"
                  value={stockUsedForm.quantity}
                  onChange={(e) =>
                    setStockUsedForm({ ...stockUsedForm, quantity: Number.parseFloat(e.target.value) || 0 })
                  }
                  className="mt-1 border-gray-200 focus:border-slate-400 focus:ring-slate-400"
                  required
                />
              </div>
              <div>
                <Label htmlFor="usedNote" className="text-sm font-semibold text-gray-700">Note</Label>
                <Input
                  id="usedNote"
                  value={stockUsedForm.note}
                  onChange={(e) => setStockUsedForm({ ...stockUsedForm, note: e.target.value })}
                  placeholder="Optional note"
                  className="mt-1 border-gray-200 focus:border-slate-400 focus:ring-slate-400"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowStockUsedModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-slate-800 hover:bg-slate-900">
                  Record Usage
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Inventory Details Modal */}
        <Dialog open={showInventoryDialog} onOpenChange={setShowInventoryDialog}>
          <DialogContent className="max-w-lg bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-500" />
                Inventory Item Details
              </DialogTitle>
            </DialogHeader>
            {selectedInventoryItem && (
              <div className="space-y-6 p-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {selectedInventoryItem.name}
                  </h3>
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${
                    selectedInventoryItem.quantity <= 10 
                      ? 'bg-red-100 text-red-800' 
                      : selectedInventoryItem.quantity <= 50 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {selectedInventoryItem.quantity} {selectedInventoryItem.unit}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500 mb-1">Current Stock</div>
                    <div className="text-xl font-bold text-gray-800">
                      {selectedInventoryItem.quantity} {selectedInventoryItem.unit}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500 mb-1">Unit</div>
                    <div className="text-xl font-bold text-gray-800">
                      {selectedInventoryItem.unit}
                    </div>
                  </div>
                </div>

                {selectedInventoryItem.quantity <= 10 && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-800">
                      <strong>Low Stock Warning:</strong> This item is running low and needs to be restocked soon.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white"
                      onClick={() => {
                        setStockUsedForm({
                          inventoryItemId: selectedInventoryItem.id,
                          quantity: 0,
                          note: ""
                        })
                        setShowInventoryDialog(false)
                        setShowStockUsedModal(true)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Record Usage
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowInventoryDialog(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
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