"use client"
import Image from "next/image"
import { useRouter } from "next/navigation"
import KitchenDashboard from "@/components/kitchendashboard/page"
import Inventory from "@/components/inventory/page"
import StaffManagementPage from "@/components/staff/page"
import MessagesPage from "@/components/messages/page"

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
  Edit,
  Trash2,
  Filter,
  ArrowUpDown,
  LogOut,
  QrCode,
  CookingPot,
} from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import EditMenuModal from "@/components/editemenu/page"
import QRCodeGenerator from "../QR/page"
import Link from "next/link"

interface MenuItem {
  id: number
  itemName: string
  price: number
  description: string
  imageUrl: string
  category: string
  createdAt: Date
  isVeg: boolean
}

interface OrderItem {
  name: string
  price: number
  quantity: number
}

interface Order {
  orderId: number | null
  id: number
  tableNumber: number
  items: OrderItem[]
  createdAt: Date
  price: number
  status: string
  totalPrice: number
  orders: Array<{
    id: number
    createdAt: Date
    price: number
    status: string
  }>
}

interface Notification {
  id: number
  title: string
  message: string
  time: string
  read: boolean
  type: "order" | "alert" | "info"
}

interface SalesAnalytics {
  id: number
  orderId: number
  totalAmount: number
  totalItemsSold: number
  topItemName: string
  topItemCount: number
  createdAt: Date
  orderAnalytics: {
    id: number
    orderId: number
    totalAmount: number
    totalItemsSold: number
    topItemName: string
    topItemCount: number
    createdAt: Date
  }[]
  totalSales: number
  todaySales: number
  monthlySales: number
  topSellingItems: unknown[]
  dailySalesData: { day: string; sales: number }[]
  recentOrders: unknown[]
}

export default function AdminDashboard() {
  const router = useRouter()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [filteredMenuItems, setFilteredMenuItems] = useState<MenuItem[]>([])
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
    isVeg: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isMenuLoading, setIsMenuLoading] = useState(true)
  const [isSalesLoading, setIsSalesLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [menuSearchQuery, setMenuSearchQuery] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortField, setSortField] = useState<string>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<MenuItem | null>(null)
  const [customerContact, setCustomerContact] = useState("")
  const [contactError, setContactError] = useState("")
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [tableStatus, setTableStatus] = useState<{ [key: number]: boolean }>({})
  const [open, setOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

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

  const topSellingItems = [
    { name: "Butter Chicken", sold: 124, revenue: 24800 },
    { name: "Paneer Tikka", sold: 98, revenue: 17640 },
    { name: "Chicken Biryani", sold: 87, revenue: 17400 },
    { name: "Masala Dosa", sold: 76, revenue: 11400 },
    { name: "Gulab Jamun", sold: 65, revenue: 6500 },
  ]


  const isValidContact = (contact: string) => {
    // Accepts 10-digit phone numbers or valid emails
    const phoneRegex = /^\d{10}$/
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return phoneRegex.test(contact) || emailRegex.test(contact)
  }

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders()
      checkTableAvailability()
    } else if (activeTab === "menu") {
      fetchMenuItems()
    } else if (activeTab === "sales") {
      fetchSalesAnalytics()
    }

    // Close notifications panel when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [activeTab])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOrders(orders)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = orders.filter(
        (order) =>
          order.id.toString().includes(query) ||
          order.tableNumber.toString().includes(query) ||
          order.items.some((item) => item.name?.toLowerCase().includes(query)),
      )
      setFilteredOrders(filtered)
    }
  }, [searchQuery, orders])

  useEffect(() => {
    let filtered = [...menuItems]

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category === selectedCategory)
    }

    // Apply search filter
    if (menuSearchQuery) {
      const query = menuSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.itemName.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query),
      )
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        // Type assertion to access properties safely
        const aValue = a[sortField as keyof MenuItem]
        const bValue = b[sortField as keyof MenuItem]

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        } else if (aValue instanceof Date && bValue instanceof Date) {
          return sortDirection === "asc" ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime()
        }
        return 0
      })
    }

    setFilteredMenuItems(filtered)
  }, [menuItems, menuSearchQuery, sortField, sortDirection, selectedCategory])

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

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

      // Transform the grouped data into individual orders for display
      const transformedOrders = data.flatMap(
        (group: { tableNumber: number; items: OrderItem[]; totalPrice: number; orders: Order[] }) =>
          group.orders.map((order: Order) => ({
            ...order,
            tableNumber: group.tableNumber,
            items: group.items,
            totalPrice: group.totalPrice,
          })),
      )

      setOrders(transformedOrders)
      setFilteredOrders(transformedOrders)
      console.log("Orders Fetched", transformedOrders)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function checkTableAvailability() {
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

      // Create an object to track which tables are occupied
      const occupiedTables: { [key: number]: boolean } = {}

      // Mark tables as occupied based on orders data
      data.forEach((group: { tableNumber: number }) => {
        occupiedTables[group.tableNumber] = true
      })

      // Set the table status
      setTableStatus(occupiedTables)

      console.log("Table status updated", occupiedTables)
    } catch (error) {
      console.error("Error checking table availability:", error)
    }
  }

  async function fetchMenuItems() {
    setIsMenuLoading(true)
    try {
      const res = await fetch("/api/v1/managemenu")
      if (!res.ok) {
        throw new Error("Failed to fetch menu items")
      }
      const data = await res.json()
      setMenuItems(data)
      setFilteredMenuItems(data)
    } catch (error) {
      console.error("Error fetching menu items:", error)
    } finally {
      setIsMenuLoading(false)
    }
  }

  async function editmenu(id: number | undefined) {
    const item = menuItems.find((item) => item.id === id)
    if (item) {
      setItemToEdit(item)
      setEditModalOpen(true)
    }
  }

  
  async function handleSaveEditedItem(updatedItem: Partial<MenuItem>) {
    if (!itemToEdit) return

    setIsMenuLoading(true)
    try {
      const res = await fetch(`/api/v1/menudelete?id=${itemToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      })

      if (!res.ok) {
        throw new Error("Failed to edit menu item")
      }

      const data = await res.json()
      console.log("Edited:", data.message)

      // Update the local state
      setMenuItems((prev) => prev.map((item) => (item.id === itemToEdit.id ? { ...item, ...updatedItem } : item)))
      setFilteredMenuItems((prev) =>
        prev.map((item) => (item.id === itemToEdit.id ? { ...item, ...updatedItem } : item)),
      )

      // Add notification
      const newNotification = {
        id: Date.now(),
        title: "Menu Item Updated",
        message: `${updatedItem.itemName} has been updated`,
        time: "Just now",
        read: false,
        type: "info" as const,
      }
      setNotifications((prev) => [newNotification, ...prev])
    } catch (error) {
      console.error("Error editing menu item:", error)
      alert("Failed to update menu item")
    } finally {
      setIsMenuLoading(false)
    }
  }

  async function deletemenu(id: number | undefined) {
    setIsMenuLoading(true)
    try {
      const res = await fetch(`/api/v1/menudelete?id=${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error("Failed to delete menu item")
      }

      const data = await res.json()
      console.log("Deleted:", data.message)

      // Optionally refetch or update the list of menu items here
      // e.g., filter out the deleted item:
      setMenuItems((prev) => prev.filter((item) => item.id !== id))
      setFilteredMenuItems((prev) => prev.filter((item) => item.id !== id))
    } catch (error) {
      console.error("Error deleting menu item:", error)
    } finally {
      setIsMenuLoading(false)
    }
  }

  async function fetchSalesAnalytics() {
    setIsSalesLoading(true)
    try {
      const res = await fetch("/api/v1/sales")
      if (!res.ok) {
        throw new Error("Failed to fetch sales analytics")
      }
      const data = await res.json()

      // Fetch top selling items
      const topItemsRes = await fetch("/api/v1/topselling")
      if (topItemsRes.ok) {
        const topItemsData = await topItemsRes.json()
        data.topSellingItems = topItemsData.items
      }
      
      setSalesAnalytics(data)
    } catch (error) {
      console.error("Error fetching sales analytics:", error)
    } finally {
      setIsSalesLoading(false)
    }
  }

  const [initial, setInitial] = useState("")

  useEffect(() => {
    const fetchName = async () => {
      const res = await fetch("/api/v1/cookiename")
      if (res.ok) {
        const data = await res.json()
        if (data.name) {
          setInitial(data.name)
        }
      }
    }

    fetchName()
  }, [])

  const handleAddItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!newItem.name || !newItem.price || !newItem.description || !newItem.category) {
      alert("Please provide all fields")
      return
    }

    try {
      const formData = new FormData()
      if (newItem.photo) {
        formData.append("photo", newItem.photo)
      }
      formData.append("name", newItem.name)
      formData.append("price", newItem.price.toString())
      formData.append("description", newItem.description)
      formData.append("category", newItem.category)
      formData.append("isVeg", newItem.isVeg.toString())

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
      setNewItem({ name: "", price: 0, photo: null, description: "", category: "", isVeg: true })

      // Refresh menu items
      fetchMenuItems()
    } catch (error) {
      console.error("Error adding item:", error)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const res = await fetch("/api/v1/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (res.ok) {
        // Redirect to login page
        router.push("/login")
      } else {
        console.error("Logout failed")
        setIsLoggingOut(false)
      }
    } catch (error) {
      console.error("Error during logout:", error)
      setIsLoggingOut(false)
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

  const printBill = async (order: Order) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const totalItemsPrice = order.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)
    const gstAmount = totalItemsPrice * 0.05
    const totalAmount = totalItemsPrice + gstAmount

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
          .item-name { flex: 2; }
          .item-qty { flex: 1; text-align: center; }
          .item-price { flex: 1; text-align: right; }
          .total { font-weight: bold; display: flex; justify-content: space-between; font-size: 14px; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          .gst {text-align:end;font-size:10px;margin-top:2px;}
        </style>
      </head>
      <body>
        <div class="bill">
          <div class="header">
            <img src="/biteandco.png" alt="" style="width:100px; height:100px;"/>
            <div class="contact">Contact: +91 9874563210</div>
            <div class="address">Address: Belgavi</div>
          </div>
          
          <div class="bill-title">BILL RECEIPT</div>
          
          <div class="bill-details">
            <div><span>Order #:</span> <span>${order.orderId}</span></div>
            <div><span>Table:</span> <span>${order.tableNumber}</span></div>
            <div><span>Date:</span> <span>${new Date(order.createdAt).toLocaleDateString()}</span></div>
            <div><span>Time:</span> <span>${new Date(order.createdAt).toLocaleTimeString()}</span></div>
          </div>
          
          <div class="items">
            <div class="item" style="font-weight: bold;">
              <span class="item-name">Item</span>
              <span class="item-qty">Qty</span>
              <span class="item-price">Price</span>
            </div>
            ${order.items
              .map(
                (item) => `
              <div class="item">
                <span class="item-name">${item.name}</span>
                <span class="item-qty">${item.quantity || 1}</span>
                <span class="item-price">₹${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>          
              </div>
            `,
              )
              .join("")}
          </div>
          <div class="gst">
          <br/>
              <span>CGST : ₹${(gstAmount / 2).toFixed(2)}
              <br/>
              <span>SGST : ₹${(gstAmount / 2).toFixed(2)}
          </div>
          <div class="total">
            <span>Total Amount:</span>
            <span>₹${totalAmount.toFixed(2)}</span>
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
    setTimeout(async () => {
      printWindow.print()

      // If customer provided contact, send/store the bill/contact
      if (customerContact.trim() && isValidContact(customerContact)) {
        // Store contact details in DB
        await fetch("/api/v1/customercontact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactNo: /^\d{10}$/.test(customerContact) ? customerContact : undefined,
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerContact) ? customerContact : undefined,
          }),
        })
        // If it's an email, send bill by email
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerContact)) {
          sendBillByEmail(customerContact, order, "", totalAmount)
        }
      }

      // Delete the order from the database after printing
      deleteOrder(order.id)
    }, 250)
  }

  const sendBillByEmail = async (email: string, order: Order, htmlContent: string, totalAmount: number) => {
    try {
      setIsSendingEmail(true)

      // Show loading notification
      const notificationId = Date.now()
      setNotifications((prev) => [
        {
          id: notificationId,
          title: "Sending Email",
          message: `Sending bill to ${email}...`,
          time: "Just now",
          read: false,
          type: "info" as const,
        },
        ...prev,
      ])

      const response = await fetch("/api/v1/billemail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject: `Your Bill Receipt - Order #${order.orderId}`,
          orderId: order.orderId,
          tableNumber: order.tableNumber,
          totalAmount: totalAmount,
          items: order.items, // Pass the items directly
        }),
      })

      if (response.ok) {
        // Update notification to success
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  title: "Email Sent",
                  message: `Bill successfully sent to ${email}`,
                  type: "info" as const,
                }
              : notification,
          ),
        )
        // Clear email field after successful send
        setCustomerContact("")
      } else {
        // Update notification to error
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  title: "Email Failed",
                  message: `Failed to send bill to ${email}`,
                  type: "alert" as const,
                }
              : notification,
          ),
        )
      }
    } catch (error) {
      console.error("Error sending email:", error)
      // Add error notification
      setNotifications((prev) => [
        {
          id: Date.now(),
          title: "Email Error",
          message: `Failed to send bill to ${email}`,
          time: "Just now",
          read: false,
          type: "alert" as const,
        },
        ...prev,
      ])
    } finally {
      setIsSendingEmail(false)
    }
  }

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
        <div key={`order-skeleton-${i}`} className="flex items-center space-x-4 p-3 border-b border-gray-100">
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
                  <td className="p-3 font-medium">{order.orderId}</td>
                  <td className="p-3">{order.tableNumber}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <span className="bg-amber-200 p-2 pr-4 pl-4 rounded-full text-black">{order.items.length}</span>
                    </div>
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
            <h3 className="text-xl font-bold text-gray-800">Order #{selectedOrder.orderId} Details</h3>
            <span className="text-gray-500 text-sm">Table: {selectedOrder.tableNumber}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white text-left border-b border-gray-200">
                  <th className="p-3 font-semibold text-gray-600 rounded-tl-xl">Itemnames</th>
                  <th className="p-3 font-semibold text-gray-600 text-right">Price</th>
                  <th className="p-3 font-semibold text-gray-600 text-center">Qty</th>
                  <th className="p-3 font-semibold text-gray-600 text-right rounded-tr-xl">Total</th>
                </tr>
              </thead>
              <tbody className="border-b border-gray-200">
                {selectedOrder.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="p-3">{item.name}</td>
                    <td className="p-3 text-right">₹{item.price.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span className="bg-gray-200 px-2 py-1 rounded-lg">{item.quantity || 1}</span>
                    </td>
                    <td className="p-3 text-right">
                     ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="">
                  <td colSpan={2} className="p-3 text-right font-light">
                    Order Total:
                  </td>
                  <td colSpan={2} className="p-3 text-right font-bold text-amber-700">
                    ₹
                    {selectedOrder.items
                      .reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)
                      .toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className="p-3 text-right font-light">
                    GST 5%:
                  </td>
                  <td colSpan={2} className="p-3 text-right font-bold text-amber-700">
                    ₹
                    {(
                      selectedOrder.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0) *
                      0.05
                    ).toFixed(2)}
                  </td>
                </tr>
                <tr className="border-t border-gray-200 bg-amber-50">
                  <td colSpan={2} className="p-3 text-right font-bold">
                    Total Amount :
                  </td>
                  <td colSpan={2} className="p-3 text-right font-bold text-amber-700">
                    ₹
                    {(
                      selectedOrder.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0) *
                      1.05
                    ).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1">
                <label htmlFor="customer-contact" className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Email or Contact No (Optional)
                </label>
                <div className="relative">
                  <input
                    id="customer-contact"
                    type="text"
                    placeholder="customer@example.com or 9876543210"
                    value={customerContact}
                    onChange={(e) => {
                      setCustomerContact(e.target.value)
                      if (e.target.value && !isValidContact(e.target.value)) {
                        setContactError("Please enter a valid email or 10-digit contact number")
                      } else {
                        setContactError("")
                      }
                    }}
                    className={`w-full p-3 border ${
                      contactError
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-amber-500 focus:border-amber-500"
                    } rounded-xl transition-all`}
                  />
                  {contactError && <p className="mt-1 text-xs text-red-500">{contactError}</p>}
                </div>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <button
                  onClick={() => printBill(selectedOrder)}
                  disabled={(customerContact.trim() !== "" && !isValidContact(customerContact)) || isSendingEmail}
                  className={`bg-amber-500 text-white px-4 py-3 rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-1 ${
                    (customerContact.trim() !== "" && !isValidContact(customerContact)) || isSendingEmail
                      ? "opacity-70 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <FileText size={16} />
                  {isSendingEmail
                    ? "Sending..."
                    : customerContact.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerContact)
                      ? "Print & Email Bill"
                      : "Print Bill"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Created at: {new Date(selectedOrder.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  )

  const renderMenu = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isVeg"
                    checked={newItem.isVeg === true}
                    onChange={() => setNewItem({ ...newItem, isVeg: true })}
                    className="h-4 w-4 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isVeg"
                    checked={newItem.isVeg === false}
                    onChange={() => setNewItem({ ...newItem, isVeg: false })}
                    className="h-4 w-4 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Non-Vegetarian</span>
                </label>
              </div>
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
                <option value="Drinks">Drinks</option>
                <option value="Rice">Rice</option>
                <option value="Soup">Soup</option>
                <option value="Main Course">Main Course</option>
                <option value="Starter">Starter</option>
                <option value="Dessert">Dessert</option>
                <option value="Indian Bread">Indian Bread</option>
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

       <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-[580px] overflow-y-scroll">
  
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Menu className="text-amber-500" size={24} />
              Current Menu
            </h2>
            <button
              onClick={fetchMenuItems}
              className="bg-amber-100 text-amber-600 px-4 py-2 rounded-xl hover:bg-amber-200 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} className={isMenuLoading ? "animate-spin" : ""} />
              {isMenuLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search menu items..."
                value={menuSearchQuery}
                onChange={(e) => setMenuSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-full"
              />
            </div>

            <div className="relative">
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="pl-4 pr-8 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
              >
                <option value="">All Categories</option>
                {Array.from(new Set(menuItems.map((item) => item.category))).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>

          {isMenuLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={`menu-skeleton-${i}`} className="flex items-center space-x-4 p-3 border-b border-gray-100">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : filteredMenuItems.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Menu className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-500 text-lg">No menu items found</p>
              <p className="text-gray-400 text-sm mt-1">Add items using the form</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left border-b border-gray-200">
                    <th className="p-3 font-semibold text-gray-600 rounded-tl-xl">Image</th>
                    <th
                      className="p-3 font-semibold text-gray-600 cursor-pointer"
                      onClick={() => handleSort("itemName")}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        {sortField === "itemName" && (
                          <ArrowUpDown size={14} className={sortDirection === "asc" ? "rotate-180" : ""} />
                        )}
                      </div>
                    </th>
                    <th className="p-3 font-semibold text-gray-600 cursor-pointer" onClick={() => handleSort("price")}>
                      <div className="flex items-center gap-1">
                        Price
                        {sortField === "price" && (
                          <ArrowUpDown size={14} className={sortDirection === "asc" ? "rotate-180" : ""} />
                        )}
                      </div>
                    </th>
                    <th className="p-3 font-semibold text-gray-600">Type</th>
                    <th
                      className="p-3 font-semibold text-gray-600 cursor-pointer"
                      onClick={() => handleSort("category")}
                    >
                      <div className="flex items-center gap-1">
                        Category
                        {sortField === "category" && (
                          <ArrowUpDown size={14} className={sortDirection === "asc" ? "rotate-180" : ""} />
                        )}
                      </div>
                    </th>
                    <th className="p-3 font-semibold text-gray-600 rounded-tr-xl text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMenuItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-amber-50 transition-colors">
                      <td className="p-3">
                        <Image
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.itemName || "Menu item"}
                          width={48}
                          height={48}
                          className="rounded-md object-cover"
                        />
                      </td>
                      <td className="p-3 font-medium">
                        <div>{item.itemName}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{item.description}</div>
                      </td>
                      <td className="p-3">₹{item.price.toFixed(2)}</td>
                      <td className="p-3">
                        <Badge
                          className={
                            item.isVeg
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }
                        >
                          {item.isVeg ? "Veg" : "Non-Veg"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">{item.category}</Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => editmenu(item.id)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deletemenu(item.id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderSalesAnalysis = () => (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6 relative">
      {/* Heading */}
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <BarChartIcon className="text-amber-500" size={24} />
        Sales Overview
      </h2>

      {/* Right-side Buttons */}
      <div className="flex items-center gap-4 relative">
        {/* Reports Dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
              activeTab === "reports" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText size={18} />
              <span className="font-medium">Reports</span>
            </div>
            <ChevronDown size={16} className={`${open ? "rotate-180" : ""} transition-transform`} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg border rounded-xl z-10">
              <Link
                href="manager/reports"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 rounded-t-xl text-end"
              >
                Monthly Reports
              </Link>
              <Link
                href="/reports/staff"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 text-end"
              >
                Staff Reports
              </Link>
              <Link
                href="/reports/inventory"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 rounded-b-xl text-end"
              >
                Inventory Reports
              </Link>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchSalesAnalytics}
          className="bg-amber-100 text-amber-600 px-4 py-2 rounded-xl hover:bg-amber-200 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} className={isSalesLoading ? "animate-spin" : ""} />
          {isSalesLoading ? "Loading..." : "Refresh"}
        </button>
      </div>
    </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Today's Sales */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-700">Today&apos;s Sales</h3>
                <div className="bg-amber-200 p-2 rounded-lg">
                  <DollarSign className="text-amber-600" size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-amber-700 mt-2">
                ₹{isSalesLoading ? "..." : (salesAnalytics?.todaySales || 0).toLocaleString()}
              </p>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="text-green-500 mr-1" size={16} />
                <span className="text-green-600 font-medium">+12.5%</span>
                <span className="text-gray-500 ml-1">from yesterday</span>
              </div>
            </div>

            {/* Weekly Sales */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-700">Items Sold (7 days)</h3>
                <div className="bg-amber-200 p-2 rounded-lg">
                  <Calendar className="text-amber-600" size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-amber-700 mt-2">
                {isSalesLoading ? "..." : (salesAnalytics?.totalItemsSold || 0).toLocaleString()}
              </p>
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
                  <Calendar className="text-amber-600" size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-amber-700 mt-2">
                ₹{isSalesLoading ? "..." : (salesAnalytics?.monthlySales || 0).toLocaleString()}
              </p>
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
          <h3 className="bg-gray-50 border border-gray-300 text-gray-700 rounded-xl p-2 text-sm">Last 7 Days</h3>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={salesAnalytics?.dailySalesData || dailySalesData}
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

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Top Selling Items</h3>
        {isSalesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={`top-items-skeleton-${i}`} className="flex items-center space-x-4 p-3 border-b border-gray-100">
                <Skeleton className="h-6 w-10" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16" />
                <div className="ml-auto">
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left border-b border-gray-200">
                  <th className="p-3 font-semibold text-gray-600 rounded-tl-xl">Rank</th>
                  <th className="p-3 font-semibold text-gray-600">Item Name</th>
                  <th className="p-3 font-semibold text-gray-600">Quantity Sold</th>
                  <th className="p-3 font-semibold text-gray-600">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(salesAnalytics?.topSellingItems || topSellingItems).slice(0, 5).map((orderAnalytics, index) => (
                  <tr
                    key={`top-item-${index}`}
                    className="border-b border-gray-100 hover:bg-amber-50 transition-colors"
                  >
                    <td className="p-3 font-medium">#{index + 1}</td>
                    <td className="p-3">{(orderAnalytics as { name: string }).name}</td>
                    <td className="p-3">{(orderAnalytics as { sold: number }).sold}</td>
                    <td className="p-3">
                      ₹
                      {(orderAnalytics as { revenue?: number; sold: number }).revenue?.toFixed(2) ||
                        ((orderAnalytics as { sold: number }).sold * 200).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  const renderTableManagement = () => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <LayoutDashboard className="text-amber-500" size={24} />
          Table Management
        </h2>
        <button
          onClick={checkTableAvailability}
          className="bg-amber-100 text-amber-600 px-4 py-2 rounded-xl hover:bg-amber-200 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((tableNumber) => (
          <div
            key={tableNumber}
            className={`p-6 rounded-xl border ${
              tableStatus[tableNumber] ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
            }`}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Table {tableNumber}</h3>
              <div className={`h-4 w-4 rounded-full ${tableStatus[tableNumber] ? "bg-red-500" : "bg-green-500"}`}></div>
            </div>

            <p className={`mt-2 ${tableStatus[tableNumber] ? "text-red-700" : "text-green-700"}`}>
              {tableStatus[tableNumber] ? "Engaged" : "Available"}
            </p>
            {tableStatus[tableNumber] && (
              <div className="mt-4 text-sm">
                <p className="text-gray-600">
                  Order ID: {orders.find((order) => order.tableNumber === tableNumber)?.orderId || "N/A"}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 text-black">
      {/* Sidebar for larger screens */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 hidden lg:block">
        <div className="p-6">
          <Image src="/biteandco.png" alt="Logo" width={48} height={48} className="h-20 w-auto mb-4 relative left-16" />
          <p className="text-sm text-gray-500 mt-1 text-center">Restaurant Management</p>
          <div className="mt-2 text-xs text-gray-500 text-center">
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

            <button
              onClick={() => setActiveTab("tables")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                activeTab === "tables" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <LayoutDashboard size={18} />
              <span className="font-medium">Tables</span>
            </button>

            <button
              onClick={() => setActiveTab("qrcodes")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                activeTab === "qrcodes" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <QrCode size={18} />
              <span className="font-medium">QR Codes</span>
            </button>

            <button
              onClick={() => setActiveTab("kitchen")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                activeTab === "kitchen" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <CookingPot size={18} />
              <span className="font-medium">Kitchen Dashboard</span>
            </button>

               <button
                  onClick={() => setActiveTab("staff")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeTab === "staff" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <User size={18} />
                  <span className="font-medium">Staff Dashboard</span>
                </button>
                <button
              onClick={() => setActiveTab("inventory")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                activeTab === "inventory" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FileText size={18} />
              <span className="font-medium">Inventory</span>
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                activeTab === "messages" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Bell size={18} />
              <span className="font-medium">Messages</span>
            </button>
            {/* Kitchen dashboard is now integrated as a tab */}
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
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {initial || "G"}
              </span>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-red-600 p-2 rounded-full hover:bg-red-50"
              >
                <LogOut size={18} />
              </button>
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
          <button
            onClick={() => setActiveTab("tables")}
            className={`flex-1 py-3 text-center border-b-2 ${
              activeTab === "tables" ? "border-amber-500 text-amber-600" : "border-transparent text-gray-600"
            }`}
          >
            <LayoutDashboard size={18} className="mx-auto mb-1" />
            <span className="text-xs">Tables</span>
          </button>
          <button
            onClick={() => setActiveTab("qrcodes")}
            className={`flex-1 py-3 text-center border-b-2 ${
              activeTab === "qrcodes" ? "border-amber-500 text-amber-600" : "border-transparent text-gray-600"
            }`}
          >
            <FileText size={18} className="mx-auto mb-1" />
            <span className="text-xs">QR Codes</span>
          </button>
          <button
            onClick={() => setActiveTab("kitchen")}
            className={`flex-1 py-3 text-center border-b-2 ${
              activeTab === "kitchen" ? "border-amber-500 text-amber-600" : "border-transparent text-gray-600"
            }`}
          >
            <CookingPot size={18} className="mx-auto mb-1" />
            <span className="text-xs">Kitchen</span>
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 py-3 text-center border-b-2 ${
              activeTab === "inventory" ? "border-amber-500 text-amber-600" : "border-transparent text-gray-600"
            }`}
          >
            <FileText size={18} className="mx-auto mb-1" />
            <span className="text-xs">Inventory</span>
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`flex-1 py-3 text-center border-b-2 ${
              activeTab === "staff" ? "border-amber-500 text-amber-600" : "border-transparent text-gray-600"
            }`}
          >
            <User size={18} className="mx-auto mb-1" />
            <span className="text-xs">Staff</span>
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex-1 py-3 text-center border-b-2 ${
              activeTab === "messages" ? "border-amber-500 text-amber-600" : "border-transparent text-gray-600"
            }`}
          >
            <Bell size={18} className="mx-auto mb-1" />
            <span className="text-xs">Messages</span>
          </button>
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
              {activeTab === "tables" && "Tables Management"}
              {activeTab === "qrcodes" && "QR Code Management"}
              {activeTab === "kitchen" && "Kitchen Dashboard"}
              {activeTab === "inventory" && "Inventory Management"}
              {activeTab === "staff" && "Staff Management"}
              {activeTab === "messages" && "Messages"}
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

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <User size={16} className="text-amber-600" />
                </div>
                <span className="font-medium text-sm">{initial || "G"}</span>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {showUserMenu && (
                <div
                  ref={userMenuRef}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50"
                >
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut size={16} />
                      <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className={`p-4 sm:p-6 lg:p-8 ${activeTab === "sales" ? "max-w-7xl" : ""} mx-auto lg:pl-72`}>
        {activeTab === "orders" && renderOrders()}
        {activeTab === "menu" && renderMenu()}
        {activeTab === "sales" && renderSalesAnalysis()}
        {activeTab === "tables" && renderTableManagement()}
        {activeTab === "qrcodes" && <QRCodeGenerator />}
        {activeTab === "kitchen" && <KitchenDashboard />}
        {activeTab === "inventory" && <Inventory />}
        {activeTab === "staff" && <StaffManagementPage />}
        {activeTab === "messages" && <MessagesPage />}
      </main>
      {editModalOpen && (
        <EditMenuModal item={itemToEdit} onClose={() => setEditModalOpen(false)} onSave={handleSaveEditedItem} />
      )}
    </div>
  )
}
