"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  BarChartIcon,
  Menu,
  ShoppingBag,
  RefreshCw,
  Eye,
  Plus,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  LayoutDashboard,
  ChevronDown,
  Search,
  Bell,
  User,
  Check,
  X,
  Clock,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface MenuItem {
  id: number
  name: string
  price: number
  imageUrl: string
}

interface Order {
  id: number
  tableNumber: number
  items: { itemName?: string }[]
  createdAt: Date
  price: number
  status: string
  orderId?: number
  quantity?: number
  itemName?: string
}

interface Notification {
  id: number
  title: string
  message: string
  time: string
  read: boolean
  type: "order" | "alert" | "info"
}

export default function AdminDashboard() {
  const [] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [activeTab, setActiveTab] = useState("orders")
  const [newItem, setNewItem] = useState({
    name: "",
    price: 0,
    photo: null as File | null,
    description: "",
    category: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "New Order",
      message: "Order #1234 has been placed",
      time: "5 min ago",
      read: false,
      type: "order",
    },
    {
      id: 2,
      title: "Low Stock Alert",
      message: "Butter Chicken is running low on stock",
      time: "1 hour ago",
      read: false,
      type: "alert",
    },
    {
      id: 3,
      title: "Payment Received",
      message: "Payment of ₹1,250 received for Order #1230",
      time: "3 hours ago",
      read: true,
      type: "info",
    },
    {
      id: 4,
      title: "New Review",
      message: "A customer left a 5-star review",
      time: "Yesterday",
      read: true,
      type: "info",
    },
  ])

  const notificationRef = useRef<HTMLDivElement>(null)

  // Mock sales data for charts
  const dailySalesData = [
    { day: "Mon", sales: 1200 },
    { day: "Tue", sales: 1900 },
    { day: "Wed", sales: 1500 },
    { day: "Thu", sales: 2100 },
    { day: "Fri", sales: 2400 },
    { day: "Sat", sales: 3100 },
    { day: "Sun", sales: 2900 },
  ]

  const monthlySalesData = [
    { month: "Jan", sales: 25000, orders: 420 },
    { month: "Feb", sales: 30000, orders: 510 },
    { month: "Mar", sales: 28000, orders: 480 },
    { month: "Apr", sales: 35000, orders: 590 },
    { month: "May", sales: 32000, orders: 540 },
    { month: "Jun", sales: 40000, orders: 670 },
  ]

  const topSellingItems = [
    { name: "Butter Chicken", sold: 124, revenue: 24800 },
    { name: "Paneer Tikka", sold: 98, revenue: 17640 },
    { name: "Chicken Biryani", sold: 87, revenue: 17400 },
    { name: "Masala Dosa", sold: 76, revenue: 11400 },
    { name: "Gulab Jamun", sold: 65, revenue: 6500 },
  ]

  const salesData = {
    dailyTotal: 12000,
    weeklyTotal: 84000,
    monthlyTotal: 360000,
  }

  useEffect(() => {
    fetchOrders()

    // Close notifications panel when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOrders(orders)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = orders.filter(
        (order) =>
          order.id.toString().includes(query) ||
          order.tableNumber.toString().includes(query) ||
          order.items.some((item) => item.itemName?.toString().toLowerCase().includes(query)),
      )
      setFilteredOrders(filtered)
    }
  }, [searchQuery, orders])

  // Keeping the original fetchOrders function intact
  async function fetchOrders() {
    setIsLoading(true)
    try {
      const res = await fetch("/api/v1/fetchorders", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        console.error("Failed to fetch orders", res.statusText)
        return
      }

      const data = await res.json()
      setOrders(data)
      setFilteredOrders(data)
      console.log("Orders Fetched", data)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Keeping the original handleAddItem function intact
  const handleAddItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!newItem.name || !newItem.price || !newItem.photo || !newItem.description || !newItem.category) {
      alert("Please provide all fields")
      return
    }

    try {
      const formData = new FormData()
      formData.append("photo", newItem.photo)
      formData.append("name", newItem.name)
      formData.append("price", newItem.price.toString())
      formData.append("description", newItem.description)
      formData.append("category", newItem.category)

      const res = await fetch("/api/v1/addmenuitem", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        console.error("Failed to add item", res.statusText)
        return
      }

      // Add notification after successful API call
      const newNotification = {
        id: Date.now(),
        title: "Menu Item Added",
        message: `${newItem.name} has been added to the menu`,
        time: "Just now",
        read: false,
        type: "info" as const,
      }

      setNotifications((prev) => [newNotification, ...prev])

      alert("Item added successfully!")
      setNewItem({ name: "", price: 0, photo: null, description: "", category: "" })
    } catch (error) {
      console.error("Error adding item:", error)
    }
  }

  const markNotificationAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  // Modify the printBill function to delete the order after printing
  const printBill = async (order: Order) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const content = `
      <html>
        <head>
          <title>Bill - Order #${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .bill { max-width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .restaurant-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .contact { font-size: 12px; margin-bottom: 3px; }
            .address { font-size: 12px; margin-bottom: 15px; }
            .bill-title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
            .bill-details { margin-bottom: 15px; font-size: 12px; }
            .bill-details div { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
            .total { font-weight: bold; display: flex; justify-content: space-between; font-size: 14px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="bill">
            <div class="header">
              <div class="restaurant-name">BITE & CO</div>
              <div class="contact">Contact: +91 9874563210</div>
              <div class="address">Address: Belgavi</div>
            </div>
            
            <div class="bill-title">BILL RECEIPT</div>
            
            <div class="bill-details">
              <div><span>Order #:</span> <span>${order.id}</span></div>
              <div><span>Table:</span> <span>${order.tableNumber}</span></div>
              <div><span>Date:</span> <span>${new Date(order.createdAt).toLocaleDateString()}</span></div>
              <div><span>Time:</span> <span>${new Date(order.createdAt).toLocaleTimeString()}</span></div>
            </div>
            
            <div class="items">
              <div class="item" style="font-weight: bold;">
                <span>Item</span>
                <span>Qty</span>
                <span>Price</span>
              </div>
              <div class="item">
                <span>${order.itemName || order.items.map((item) => item.itemName).join(", ")}</span>
                <span>${order.quantity || 1}</span>
                <span>₹${order.price.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="total">
              <span>Total Amount:</span>
              <span>₹${order.price.toFixed(2)}</span>
            </div>
            
            <div class="footer">
              <p>Thank you for dining with us!</p>
              <p>Visit again soon!</p>
            </div>
          </div>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(content)
    printWindow.document.close()

    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print()

      // Delete the order from the database after printing
      deleteOrder(order.id)
    }, 250)
  }

  // Add a function to delete the order from the database
  const deleteOrder = async (orderId: number) => {
    try {
      const res = await fetch(`/api/v1/deleteorder?id=${orderId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        console.error("Failed to delete order", res.statusText)
        return
      }

      // Remove the order from the local state
      setOrders(orders.filter((order) => order.id !== orderId))
      setFilteredOrders(filteredOrders.filter((order) => order.id !== orderId))
      setSelectedOrder(null)

      // Add notification for order deletion
      const newNotification = {
        id: Date.now(),
        title: "Order Completed",
        message: `Order #${orderId} has been completed and removed`,
        time: "Just now",
        read: false,
        type: "info" as const,
      }

      setNotifications((prev) => [newNotification, ...prev])
    } catch (error) {
      console.error("Error deleting order:", error)
    }
  }

  const renderOrderSkeletons = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center space-x-4 p-3 border-b border-gray-100">
          <Skeleton className="h-6 w-10" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
          <div className="ml-auto">
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  )

  const renderOrders = () => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingBag className="text-amber-500" size={24} />
          Customer Orders
        </h2>
        <button
          onClick={fetchOrders}
          className="bg-amber-100 text-amber-600 px-4 py-2 rounded-xl hover:bg-amber-200 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {isLoading ? (
        renderOrderSkeletons()
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FileText className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-500 text-lg">No orders found</p>
          <p className="text-gray-400 text-sm mt-1">New orders will appear here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-gray-200">
                <th className="p-3 font-semibold text-gray-600 rounded-tl-xl">#ID</th>
                <th className="p-3 font-semibold text-gray-600">Table NO</th>
                <th className="p-3 font-semibold text-gray-600">Items</th>
                <th className="p-3 font-semibold text-gray-600 rounded-tr-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className={`border-b border-gray-100 hover:bg-amber-50 transition-colors ${selectedOrder?.id === order.id ? "bg-amber-50" : ""}`}
                >
                  <td className="p-3 font-medium">{order.id}</td>
                  <td className="p-3">{order.tableNumber}</td>
                  <td className="p-3">
                    <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {order.itemName || order.items.map((item) => item.itemName).join(", ")}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedOrder(order.id === selectedOrder?.id ? null : order)}
                        className={`${
                          selectedOrder?.id === order.id
                            ? "bg-gray-200 text-gray-700"
                            : "bg-amber-500 text-white hover:bg-amber-600"
                        } px-4 py-2 rounded-xl transition-colors flex items-center gap-1`}
                      >
                        <Eye size={16} />
                        {selectedOrder?.id === order.id ? "Hide" : "View"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Order #{selectedOrder.id} Details</h3>
            <span className="text-gray-500 text-sm">Table: {selectedOrder.tableNumber}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white text-left border-b border-gray-200">
                  <th className="p-3 font-semibold text-gray-600 rounded-tl-xl">Item</th>
                  <th className="p-3 font-semibold text-gray-600 text-right">Price</th>
                  <th className="p-3 font-semibold text-gray-600 text-center">Qty</th>
                  <th className="p-3 font-semibold text-gray-600 text-right rounded-tr-xl">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="p-3">
                    {selectedOrder.itemName || selectedOrder.items.map((item) => item.itemName).join(", ")}
                  </td>
                  <td className="p-3 text-right">₹{selectedOrder.price.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <span className="bg-gray-200 px-2 py-1 rounded-lg">{selectedOrder.quantity || 1}</span>
                  </td>
                  <td className="p-3 text-right">
                    <span
                      className={`px-2 py-1 rounded-lg ${
                        selectedOrder.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : selectedOrder.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {selectedOrder.status}
                    </span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-amber-50">
                  <td colSpan={2} className="p-3 text-right font-bold">
                    Order Total:
                  </td>
                  <td colSpan={2} className="p-3 text-right font-bold text-amber-700">
                    ₹{selectedOrder.price.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => printBill(selectedOrder)}
              className="bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-1"
            >
              <FileText size={16} />
              Print Bill
            </button>
            <span className="text-xs text-gray-500">
              Created at: {new Date(selectedOrder.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  )

  const renderMenu = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Plus className="text-amber-500" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Add New Item</h2>
        </div>

        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input
              type="text"
              placeholder="e.g. Butter Chicken"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
            <input
              type="number"
              placeholder="e.g. 299"
              value={newItem.price}
              onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
            <div className="relative border border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors">
              {newItem.photo ? (
                <div className="text-sm text-gray-600">
                  {newItem.photo.name} ({Math.round(newItem.photo.size / 1024)} KB)
                </div>
              ) : (
                <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewItem({ ...newItem, photo: e.target.files?.[0] || null })}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              placeholder="Describe the dish..."
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white"
            >
              <option value="" disabled>
                Select Category
              </option>
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
              <option value="Drinks">Drinks</option>
              <option value="Rice">Rice</option>
              <option value="Soup">Soup</option>
              <option value="Main Course">Main Course</option>
              <option value="Starter">Starter</option>
              <option value="Dessert">Dessert</option>
              <option value="Snacks">Snacks</option>
              <option value="Fast Food">Fast Food</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 text-white px-4 py-3 rounded-xl hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add to Menu
          </button>
        </form>
      </div>

      <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Menu className="text-amber-500" size={24} />
          Current Menu
        </h2>

        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Menu className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-500 text-lg">No menu items to display</p>
          <p className="text-gray-400 text-sm mt-1">Add items using the form</p>
        </div>
      </div>
    </div>
  )

  const renderSalesAnalysis = () => (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BarChartIcon className="text-amber-500" size={24} />
            Sales Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Daily Sales */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-700">Today&apos;s Sales</h3>
                <div className="bg-amber-200 p-2 rounded-lg">
                  <DollarSign className="text-amber-600" size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-amber-700 mt-2">₹{salesData.dailyTotal.toLocaleString()}</p>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="text-green-500 mr-1" size={16} />
                <span className="text-green-600 font-medium">+12.5%</span>
                <span className="text-gray-500 ml-1">from yesterday</span>
              </div>
            </div>

            {/* Weekly Sales */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-700">Weekly Sales</h3>
                <div className="bg-amber-200 p-2 rounded-lg">
                  <Calendar className="text-amber-600" size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-amber-700 mt-2">₹{salesData.weeklyTotal.toLocaleString()}</p>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="text-green-500 mr-1" size={16} />
                <span className="text-green-600 font-medium">+8.2%</span>
                <span className="text-gray-500 ml-1">from last week</span>
              </div>
            </div>

            {/* Monthly Sales */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-700">Monthly Sales</h3>
                <div className="bg-amber-200 p-2 rounded-lg">
                  <BarChartIcon className="text-amber-600" size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-amber-700 mt-2">₹{salesData.monthlyTotal.toLocaleString()}</p>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="text-green-500 mr-1" size={16} />
                <span className="text-green-600 font-medium">+15.3%</span>
                <span className="text-gray-500 ml-1">from last month</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Sales Trend</h3>
          <select className="bg-gray-50 border border-gray-300 text-gray-700 rounded-xl p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dailySalesData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #f59e0b",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value) => [`₹${value}`, "Sales"]}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: "#f59e0b", r: 6 }}
                activeDot={{ fill: "#d97706", r: 8, stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Top Selling Items</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topSellingItems}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #f59e0b",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value, name) => [
                    name === "sold" ? `${value} units` : `₹${value}`,
                    name === "sold" ? "Units Sold" : "Revenue",
                  ]}
                />
                <Bar dataKey="sold" fill="#fbbf24" name="Units Sold" radius={[0, 4, 4, 0]} />
                <Bar dataKey="revenue" fill="#f59e0b" name="Revenue (₹)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlySalesData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" stroke="#f59e0b" />
                <YAxis yAxisId="right" orientation="right" stroke="#78350f" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #f59e0b",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value, name) => [
                    name === "sales" ? `₹${value}` : value,
                    name === "sales" ? "Sales" : "Orders",
                  ]}
                />
                <Bar yAxisId="left" dataKey="sales" fill="#f59e0b" name="Sales" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="orders" fill="#78350f" name="Orders" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 text-black">
      {/* Sidebar for larger screens */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 hidden lg:block">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-amber-500">BITE & CO</h1>
          <p className="text-sm text-gray-500 mt-1">Restaurant Management</p>
          <div className="mt-2 text-xs text-gray-500">
            <p>Contact: +91 9874563210</p>
            <p>Address: Belgavi</p>
          </div>
        </div>

        <div className="px-3 py-4">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                activeTab === "orders" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ShoppingBag size={18} />
              <span className="font-medium">Orders</span>
            </button>

            <button
              onClick={() => setActiveTab("menu")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                activeTab === "menu" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Menu size={18} />
              <span className="font-medium">Menu</span>
            </button>

            <button
              onClick={() => setActiveTab("sales")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                activeTab === "sales" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <BarChartIcon size={18} />
              <span className="font-medium">Sales</span>
            </button>

            <a
              href="/kitchen"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors text-gray-600 hover:bg-gray-50"
            >
              <FileText size={18} />
              <span className="font-medium">Kitchen Dashboard</span>
            </a>
          </div>
        </div>
      </div>

      {/* Top navigation for mobile */}
      <nav className="bg-white shadow-sm sticky top-0 z-10 lg:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center flex-col">
                <h1 className="text-xl font-bold text-amber-500">BITE & CO</h1>
                <div className="text-xs text-gray-500">
                  <span>+91 9874563210 | Belgavi</span>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Admin</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile tab navigation */}
      <div className="bg-white shadow-sm sticky top-16 z-10 lg:hidden">
        <div className="flex justify-between px-4">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 py-3 text-center border-b-2 ${
              activeTab === "orders" ? "border-amber-500 text-amber-600" : "border-transparent text-gray-600"
            }`}
          >
            <ShoppingBag size={18} className="mx-auto mb-1" />
            <span className="text-xs">Orders</span>
          </button>
          <button
            onClick={() => setActiveTab("menu")}
            className={`flex-1 py-3 text-center border-b-2 ${
              activeTab === "menu" ? "border-amber-500 text-amber-600" : "border-transparent text-gray-600"
            }`}
          >
            <Menu size={18} className="mx-auto mb-1" />
            <span className="text-xs">Menu</span>
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={`flex-1 py-3 text-center border-b-2 ${
              activeTab === "sales" ? "border-amber-500 text-amber-600" : "border-transparent text-gray-600"
            }`}
          >
            <BarChartIcon size={18} className="mx-auto mb-1" />
            <span className="text-xs">Sales</span>
          </button>
          <a href="/kitchen-dashboard" className="flex-1 py-3 text-center border-b-2 border-transparent text-gray-600">
            <FileText size={18} className="mx-auto mb-1" />
            <span className="text-xs">Kitchen</span>
          </a>
        </div>
      </div>

      {/* Top bar for desktop */}
      <div className="hidden lg:block lg:pl-64">
        <div className="bg-white border-b border-gray-200 py-4 px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="text-amber-500" size={20} />
            <h2 className="text-xl font-semibold">
              {activeTab === "orders" && "Orders Management"}
              {activeTab === "menu" && "Menu Management"}
              {activeTab === "sales" && "Sales Analytics"}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-64"
              />
            </div>

            <div className="relative">
              <button
                className="relative p-2 rounded-full hover:bg-gray-100"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} className="text-gray-600" />
                {notifications.some((n) => !n.read) && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </button>

              {showNotifications && (
                <div
                  ref={notificationRef}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50"
                >
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-amber-600 hover:text-amber-700"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Bell className="mx-auto text-gray-300 mb-2" size={24} />
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? "bg-amber-50" : ""}`}
                        >
                          <div className="flex justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${!notification.read ? "bg-amber-500" : "bg-gray-300"}`}
                                ></div>
                                <p className="font-medium text-gray-800">{notification.title}</p>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <div className="flex items-center text-xs text-gray-500 mt-2">
                                <Clock size={12} className="mr-1" />
                                {notification.time}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              {!notification.read && (
                                <button
                                  onClick={() => markNotificationAsRead(notification.id)}
                                  className="text-amber-600 hover:text-amber-700"
                                >
                                  <Check size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                <User size={16} className="text-amber-600" />
              </div>
              <span className="font-medium text-sm">Admin</span>
              <ChevronDown size={16} className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <main className={`p-4 sm:p-6 lg:p-8 ${activeTab === "sales" ? "max-w-7xl" : ""} mx-auto lg:pl-72`}>
        {activeTab === "orders" && renderOrders()}
        {activeTab === "menu" && renderMenu()}
        {activeTab === "sales" && renderSalesAnalysis()}
      </main>
    </div>
  )
}
