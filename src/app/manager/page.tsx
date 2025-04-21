"use client"

import type React from "react"
import { useState, useEffect, type ReactNode } from "react"
import {
  BarChart,
  Menu,
  ShoppingBag,
  RefreshCw,
  Eye,
  Plus,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  Package,
  Coffee,
} from "lucide-react"

interface MenuItem {
  id: number
  name: string
  price: number
  imageUrl: string
}

interface OrderItem {
  [x: string]: ReactNode
  id: number
  name: string
  price: number
  quantity: number
  imageUrl: string
}

interface Order {
  id: number
  username: string
  items: OrderItem[]
}

export default function AdminDashboard() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
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

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setIsLoading(true)
    try {
      const res = await fetch("/api/v1/fetchorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) {
        console.error("Failed to fetch orders", res.statusText)
        return
      }

      const data = await res.json()
      setOrders(data)
      console.log("Orders Fetched ", data)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

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

      alert("Item added successfully!")
      setNewItem({ name: "", price: 0, photo: null, description: "", category: "" })
    } catch (error) {
      console.error("Error adding item:", error)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Veg":
        return <span className="text-green-500">●</span>
      case "Non-Veg":
        return <span className="text-red-500">●</span>
      case "Drinks":
        return <Coffee size={16} />
      default:
        return <Package size={16} />
    }
  }

  const renderOrders = () => (
    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingBag className="text-blue-600" size={24} />
          Customer Orders
        </h2>
        <button
          onClick={fetchOrders}
          className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {orders.length === 0 && !isLoading ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-500 text-lg">No orders found</p>
          <p className="text-gray-400 text-sm mt-1">New orders will appear here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-gray-200">
                <th className="p-3 font-semibold text-gray-600 rounded-tl-lg">#ID</th>
                <th className="p-3 font-semibold text-gray-600">Table NO</th>
                <th className="p-3 font-semibold text-gray-600">Items</th>
                <th className="p-3 font-semibold text-gray-600 rounded-tr-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr
                  key={order.id}
                  className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${selectedOrder?.id === order.id ? "bg-blue-50" : ""}`}
                >
                  <td className="p-3 font-medium">{order.id}</td>
                  <td className="p-3">{order.username}</td>
                  <td className="p-3">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedOrder(order.id === selectedOrder?.id ? null : order)}
                      className={`${
                        selectedOrder?.id === order.id
                          ? "bg-gray-200 text-gray-700"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      } px-4 py-2 rounded-lg transition-colors flex items-center gap-1 ml-auto`}
                    >
                      <Eye size={16} />
                      {selectedOrder?.id === order.id ? "Hide" : "View"}
                    </button>
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
            <span className="text-gray-500 text-sm">Customer: {selectedOrder.username}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white text-left border-b border-gray-200">
                  <th className="p-3 font-semibold text-gray-600 rounded-tl-lg">#</th>
                  <th className="p-3 font-semibold text-gray-600">Item</th>
                  <th className="p-3 font-semibold text-gray-600 text-right">Price</th>
                  <th className="p-3 font-semibold text-gray-600 text-center">Qty</th>
                  <th className="p-3 font-semibold text-gray-600 text-right rounded-tr-lg">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="p-3 font-medium">{index + 1}</td>
                    <td className="p-3">{item.itemName}</td>
                    <td className="p-3 text-right">₹{item.price.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span className="bg-gray-200 px-2 py-1 rounded-lg">{item.quantity}</span>
                    </td>
                    <td className="p-3 text-right font-medium">₹{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50">
                  <td colSpan={4} className="p-3 text-right font-bold">
                    Order Total:
                  </td>
                  <td className="p-3 text-right font-bold text-blue-700">
                    ₹{selectedOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  const renderMenu = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="md:col-span-1 bg-white shadow-lg rounded-xl p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <Plus className="text-green-600" size={24} />
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
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
          <input
            type="number"
            placeholder="e.g. 299"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
          <div className="relative border border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer">
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
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
          >
            <option value="" disabled>Select Category</option>
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
          className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add to Menu
        </button>
      </form>
    </div>

    <div className="md:col-span-2 bg-white shadow-lg rounded-xl p-6 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Menu className="text-blue-600" size={24} />
        Current Menu
      </h2>

      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Menu className="mx-auto text-gray-400 mb-3" size={48} />
        <p className="text-gray-500 text-lg">No menu items to display</p>
        <p className="text-gray-400 text-sm mt-1">Add items using the form</p>
      </div>
    </div>
  </div>
    )

  const renderSalesAnalysis = () => (
    <div className="space-y-6">
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BarChart className="text-blue-600" size={24} />
          Sales Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-700">Today's Sales</h3>
              <DollarSign className="text-blue-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-blue-700 mt-2">₹12,459</p>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="text-green-500 mr-1" size={16} />
              <span className="text-green-600 font-medium">+12.5%</span>
              <span className="text-gray-500 ml-1">from yesterday</span>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-xl border border-green-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-700">Weekly Sales</h3>
              <Calendar className="text-green-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-green-700 mt-2">₹86,320</p>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="text-green-500 mr-1" size={16} />
              <span className="text-green-600 font-medium">+8.2%</span>
              <span className="text-gray-500 ml-1">from last week</span>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-700">Monthly Sales</h3>
              <BarChart className="text-purple-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-purple-700 mt-2">₹342,590</p>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="text-green-500 mr-1" size={16} />
              <span className="text-green-600 font-medium">+15.3%</span>
              <span className="text-gray-500 ml-1">from last month</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Sales Trend</h3>
          <select className="bg-gray-50 border border-gray-300 text-gray-700 rounded-lg p-2 text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>

        <div className="bg-gray-50 h-64 rounded-lg flex items-center justify-center border border-gray-200">
          <div className="text-center">
            <BarChart className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-500">Sales chart will appear here</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Top Selling Items</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 h-10 w-10 rounded-lg flex items-center justify-center">
                    <Package className="text-blue-600" size={18} />
                  </div>
                  <div>
                    <p className="font-medium">Item {i}</p>
                    <p className="text-sm text-gray-500">Sold: {Math.floor(Math.random() * 100) + 20} units</p>
                  </div>
                </div>
                <p className="font-bold text-blue-700">₹{(Math.random() * 1000 + 100).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Order #{Math.floor(Math.random() * 10000)}</p>
                  <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  Completed
                </span>
                <p className="font-bold text-blue-700">₹{(Math.random() * 1000 + 100).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <nav className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">BITE & CO</h1>
              </div>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-4">
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`${
                    activeTab === "orders"
                      ? "bg-blue-50 text-blue-700 border-blue-500"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent"
                  } px-4 py-2 rounded-lg text-sm font-medium border-l-4 transition-all flex items-center gap-2`}
                >
                  <ShoppingBag size={18} />
                  Orders
                </button>
                <button
                  onClick={() => setActiveTab("menu")}
                  className={`${
                    activeTab === "menu"
                      ? "bg-blue-50 text-blue-700 border-blue-500"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent"
                  } px-4 py-2 rounded-lg text-sm font-medium border-l-4 transition-all flex items-center gap-2`}
                >
                  <Menu size={18} />
                  Menu
                </button>
                <button
                  onClick={() => setActiveTab("sales")}
                  className={`${
                    activeTab === "sales"
                      ? "bg-blue-50 text-blue-700 border-blue-500"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent"
                  } px-4 py-2 rounded-lg text-sm font-medium border-l-4 transition-all flex items-center gap-2`}
                >
                  <BarChart size={18} />
                  Sales
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Admin</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === "orders" && renderOrders()}
        {activeTab === "menu" && renderMenu()}
        {activeTab === "sales" && renderSalesAnalysis()}
      </main>
    </div>
  )
}

