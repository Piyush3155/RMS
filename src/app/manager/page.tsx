"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { BarChart, Menu, ShoppingBag } from "lucide-react"

interface MenuItem {
  id: number
  name: string
  price: number
  imageUrl: string
}

interface OrderItem {
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
  const [newItem, setNewItem] = useState({ name: "", price: 0, imageUrl: "" })
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [activeTab, setActiveTab] = useState("orders")

  useEffect(() => {
    fetchMenu()
    fetchOrders()
  }, [])

  async function fetchMenu() {
    const res = await fetch("/api/v1/menu")
    const data = await res.json()
    setMenuItems(data)
  }

  async function fetchOrders() {
    try {
      const res = await fetch("/api/v1/orders")
      if (!res.ok) {
        console.error("Failed to fetch orders", res.statusText)
        return
      }
      const data = await res.json()
      setOrders(data)
    } catch (error) {
      console.error("Error fetching orders:", error)
    }
  }

  async function addMenuItem(e: React.FormEvent) {
    e.preventDefault()
    await fetch("/api/v1/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    })
    setNewItem({ name: "", price: 0, imageUrl: "" })
    fetchMenu()
  }

  async function fetchOrderDetails(orderId: number) {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`)
      if (!res.ok) {
        console.error("Failed to fetch order details", res.statusText)
        return
      }
      const data = await res.json()
      setSelectedOrder(data)
    } catch (error) {
      console.error("Error fetching order details:", error)
    }
  }

  const renderOrders = () => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Customer Orders</h2>
        <button onClick={fetchOrders} className="bg-gray-200 p-2 rounded hover:bg-gray-300">
          Refresh
        </button>
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Order ID</th>
            <th className="p-2 text-left">Username</th>
            <th className="p-2 text-left">Items</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b">
              <td className="p-2">{order.id}</td>
              <td className="p-2">{order.username}</td>
              <td className="p-2">{order.items.length}</td>
              <td className="p-2">
                <button
                  onClick={() => fetchOrderDetails(order.id)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedOrder && (
        <div className="mt-8 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Order Details - Order #{selectedOrder.id}</h3>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Item</th>
                <th className="p-2 text-left">Price</th>
                <th className="p-2 text-left">Quantity</th>
                <th className="p-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {selectedOrder.items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">{item.name}</td>
                  <td className="p-2">${item.price.toFixed(2)}</td>
                  <td className="p-2">{item.quantity}</td>
                  <td className="p-2">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-right">
            <strong>
              Total: ${selectedOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
            </strong>
          </div>
        </div>
      )}
    </div>
  )

  const renderMenu = () => (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Menu Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Add Menu Item</h3>
          <form onSubmit={addMenuItem} className="space-y-4">
            <input
              type="text"
              placeholder="Name"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <input
              type="number"
              placeholder="Price"
              value={newItem.price}
              onChange={(e) => setNewItem({ ...newItem, price: Number.parseFloat(e.target.value) })}
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              placeholder="Image URL"
              value={newItem.imageUrl}
              onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Add Item
            </button>
          </form>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Current Menu Items</h3>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id} className="flex justify-between items-center border-b pb-2">
                <span>{item.name}</span>
                <span>${item.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )

  const renderSalesAnalysis = () => (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Sales Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Today's Sales</h3>
          <p className="text-2xl font-bold">$XXX.XX</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Weekly Sales</h3>
          <p className="text-2xl font-bold">$X,XXX.XX</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Monthly Sales</h3>
          <p className="text-2xl font-bold">$XX,XXX.XX</p>
        </div>
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Sales Chart</h3>
        <div className="bg-gray-200 h-64 flex items-center justify-center">
          <p>Sales chart placeholder</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 text-black">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`${
                    activeTab === "orders"
                      ? "border-blue-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <ShoppingBag className="mr-2" size={20} />
                  Orders
                </button>
                <button
                  onClick={() => setActiveTab("menu")}
                  className={`${
                    activeTab === "menu"
                      ? "border-blue-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Menu className="mr-2" size={20} />
                  Menu
                </button>
                <button
                  onClick={() => setActiveTab("sales")}
                  className={`${
                    activeTab === "sales"
                      ? "border-blue-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <BarChart className="mr-2" size={20} />
                  Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === "orders" && renderOrders()}
        {activeTab === "menu" && renderMenu()}
        {activeTab === "sales" && renderSalesAnalysis()}
      </main>
    </div>
  )
}

