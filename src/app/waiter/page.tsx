"use client"

import { useEffect, useState, useRef } from "react"
import { Loader2, Utensils, CheckCircle, ShoppingBag, PlusCircle, MinusCircle, Check, AlertCircle, Search, Leaf, Drumstick, RotateCw, XCircle } from "lucide-react"
import Image from "next/image"

// --- Types ---
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
  notes?: string
}

interface MenuItem {
  id: number
  itemName: string
  price: number
  description: string
  imageUrl: string
  category: string
  isVeg?: boolean
  rating?: number
  prepTime?: string
}

// --- Helper ---

// --- Main Page ---
export default function WaiterPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [loadingMenu, setLoadingMenu] = useState(true)
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([])
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<"all" | "veg" | "non-veg">("all")
  const [tableNo, setTableNo] = useState("")
  const [tableError, setTableError] = useState("")

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  // Add state for updating order status
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  // audio & new-order detection refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const prevCompletedIdsRef = useRef<Set<string>>(new Set())
  const firstOrderLoadRef = useRef<boolean>(true)

  // Persist cart and table number to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("rms_cart")
      if (saved) setCart(JSON.parse(saved))
      const savedTable = localStorage.getItem("rms_table")
      if (savedTable) setTableNo(savedTable)
    } catch {
      // ignore
    }
  }, [])

  // initialize audio (place a ding file in /public/ding.mp3 or change path)
  useEffect(() => {
    try {
      audioRef.current = new Audio("/ding.mp3")
      audioRef.current.preload = "auto"
      audioRef.current.volume = 0.7
    } catch {
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("rms_cart", JSON.stringify(cart))
    } catch {}
  }, [cart])

  useEffect(() => {
    try {
      localStorage.setItem("rms_table", tableNo)
    } catch {}
  }, [tableNo])

  // Fetch ready-to-serve orders
  useEffect(() => {
    async function fetchOrders() {
      setLoadingOrders(true)
      try {
        const res = await fetch("/api/v1/kitchenorders")
        const data = await res.json()
        // sort by timestamp desc and filter completed
        const sorted = data.sort((a: Order, b: Order) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        const completed = sorted.filter((o: Order) => o.status === "completed")

        // detect newly arrived completed orders (skip on first load)
        const newCompletedIds: Set<string> = new Set(completed.map((o: Order) => o.id))
        const prev = prevCompletedIdsRef.current
        const newlyArrived = Array.from(newCompletedIds).filter(id => !prev.has(id))
        if (!firstOrderLoadRef.current && newlyArrived.length > 0) {
          // attempt to play sound; if blocked, show a small toast to instruct user to interact
          audioRef.current?.play().catch(() => {
            setToast({ message: "Enable sound by interacting with the page", type: "info" })
            setTimeout(() => setToast(null), 2500)
          })
        }
        prevCompletedIdsRef.current = newCompletedIds
        firstOrderLoadRef.current = false

        setOrders(completed)
      } catch {
        setOrders([])
      }
      setLoadingOrders(false)
    }
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [])

  // Fetch menu
  useEffect(() => {
    async function fetchMenu() {
      setLoadingMenu(true)
      try {
        const res = await fetch("/api/v1/menu")
        const data = await res.json()
        setMenu(data)
      } catch {
        setMenu([])
      }
      setLoadingMenu(false)
    }
    fetchMenu()
  }, [])

  // Cart helpers
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const found = prev.find((ci) => ci.item.id === item.id)
      if (found) {
        return prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        )
      }
      return [...prev, { item, quantity: 1 }]
    })
  }
  const updateCart = (itemId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) =>
          ci.item.id === itemId
            ? { ...ci, quantity: Math.max(1, ci.quantity + delta) }
            : ci
        )
        .filter((ci) => ci.quantity > 0)
    )
  }
  const removeFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((ci) => ci.item.id !== itemId))
  }
  const cartTotal = cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0)

  // Filtered menu
  const filteredMenu = menu.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
    let matchesCategory = true
    if (category === "veg") matchesCategory = !!(item.isVeg === true || (item.category && item.category.toLowerCase().includes("veg") && !item.category.toLowerCase().includes("non")))
    if (category === "non-veg") matchesCategory = !!(item.isVeg === false || (item.category && (item.category.toLowerCase().includes("non-veg") || item.category.toLowerCase().includes("nonveg"))))
    return matchesSearch && matchesCategory
  })

  // Place order
  const placeOrder = async () => {
    setTableError("")
    if (cart.length === 0) {
      setToast({ message: "Cart is empty", type: "info" })
      return
    }
    const trimmed = tableNo.trim()
    if (!trimmed) {
      setTableError("Please enter table number")
      return
    }
    // validate positive integer table number
    if (!/^\d+$/.test(trimmed) || Number(trimmed) <= 0) {
      setTableError("Table number must be a positive number")
      return
    }
    setPlacingOrder(true)
    try {
      const items = cart.map((ci) => ({
        itemName: ci.item.itemName,
        quantity: ci.quantity,
        price: ci.item.price,
      }))
      const res = await fetch("/api/v1/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: trimmed, items, price: cartTotal }),
      })
      if (!res.ok) throw new Error("Order failed")
      setOrderSuccess(true)
      setCart([])
      setToast({ message: "Order placed successfully", type: "success" })
      setTimeout(() => setOrderSuccess(false), 2000)
      // optionally clear table number: keep it by default, but trim
      setTableNo(trimmed)
      setTimeout(() => setToast(null), 3000)
    } catch {
      setToast({ message: "Failed to place order", type: "error" })
      setTimeout(() => setToast(null), 3000)
    }
    setPlacingOrder(false)
  }

  // clear cart helper
  const clearCart = () => {
    setCart([])
    setToast({ message: "Cleared cart", type: "info" })
    setTimeout(() => setToast(null), 2000)
  }

  // Function to mark order as served
  const markAsServed = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    try {
      await fetch(`/api/v1/kitchenorders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "served" }),
      });
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: "served" } : order
        )
      );
      setToast({ message: "Order marked as served", type: "success" })
      setTimeout(() => setToast(null), 2500)
    } catch {
      setToast({ message: "Failed to update order status", type: "error" })
      setTimeout(() => setToast(null), 2500)
    }
    setUpdatingOrderId(null);
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Toast / notifications */}
      <div aria-live="polite" className="fixed top-5 right-5 z-50">
        {toast && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded shadow-lg ${toast.type === "success" ? "bg-green-600 text-white" : toast.type === "error" ? "bg-red-600 text-white" : "bg-gray-800 text-white"}`}>
            {toast.type === "success" ? <CheckCircle size={18} /> : toast.type === "error" ? <AlertCircle size={18} /> : <RotateCw size={18} />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button className="ml-2 opacity-80" onClick={() => setToast(null)} aria-label="Dismiss">
              <XCircle size={16} />
            </button>
          </div>
        )}
      </div>

      <header className="bg-white shadow p-4 flex items-center gap-4">
        <Image src="/biteandco.png" alt="Logo" width={40} height={40} className="rounded-lg" />
        <h1 className="text-2xl font-bold text-gray-800">Waiter Dashboard</h1>
      </header>

      <main className="container mx-auto py-6 px-4">
        {/* Orders to be served */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Utensils className="text-blue-500" /> Orders Ready to Serve
            </h2>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-2 bg-white border px-3 py-1 rounded shadow-sm hover:bg-gray-50"
                onClick={async () => {
                  setLoadingOrders(true)
                  try {
                    const res = await fetch("/api/v1/kitchenorders")
                    const data = await res.json()
                    const sorted = data.sort((a: Order, b: Order) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    setOrders(sorted.filter((o: Order) => o.status === "completed"))
                    setToast({ message: "Orders refreshed", type: "info" })
                    setTimeout(() => setToast(null), 1500)
                  } catch {
                    setToast({ message: "Failed to refresh", type: "error" })
                    setTimeout(() => setToast(null), 1500)
                  }
                  setLoadingOrders(false)
                }}
                aria-label="Refresh orders"
              >
                <RotateCw size={16} /> Refresh
              </button>
            </div>
          </div>

          {loadingOrders ? (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto text-blue-400 mb-2" size={32} />
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center shadow">
              <CheckCircle className="mx-auto text-green-400 mb-2" size={32} />
              <p className="text-lg font-medium text-gray-700">No orders to serve right now.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-400">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-bold text-lg">Table #{order.tableNumber}</span>
                      <span className="ml-2 text-xs text-gray-400">{new Date(order.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                      {order.status === "served" ? "Served" : "Ready"}
                    </span>
                  </div>
                  <ul className="mb-2">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between text-gray-700">
                        <span>{item.itemName}</span>
                        <span className="font-semibold">×{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                  {order.notes && (
                    <div className="text-xs text-gray-500 italic bg-slate-50 rounded p-2 mt-2">
                      <span className="font-semibold">Notes:</span> {order.notes}
                    </div>
                  )}
                  {/* Mark as Served button */}
                  {order.status === "completed" && (
                    <button
                      className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold flex items-center gap-2 disabled:opacity-60"
                      onClick={() => markAsServed(order.id)}
                      disabled={updatingOrderId === order.id}
                    >
                      {updatingOrderId === order.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                      Mark as Served
                    </button>
                  )}
                  {order.status === "served" && (
                    <div className="mt-3 bg-blue-50 text-blue-700 px-4 py-2 rounded font-semibold flex items-center gap-2">
                      <CheckCircle size={18} /> Served
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Menu and Add Items */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShoppingBag className="text-amber-500" /> Add Items for Customer
          </h2>
          {/* Search and Category Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search menu..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full p-2 pl-9 border border-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <div className="flex gap-2">
              <button
                className={`flex items-center gap-1 px-3 py-1 rounded-full border ${category === "all" ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-700 border-gray-200"}`}
                onClick={() => setCategory("all")}
              >
                All
              </button>
              <button
                className={`flex items-center gap-1 px-3 py-1 rounded-full border ${category === "veg" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-200"}`}
                onClick={() => setCategory("veg")}
              >
                <Leaf size={16} /> Veg
              </button>
              <button
                className={`flex items-center gap-1 px-3 py-1 rounded-full border ${category === "non-veg" ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-700 border-gray-200"}`}
                onClick={() => setCategory("non-veg")}
              >
                <Drumstick size={16} /> Non-Veg
              </button>
            </div>
          </div>
          {loadingMenu ? (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto text-amber-400 mb-2" size={32} />
              <p className="text-gray-500">Loading menu...</p>
            </div>
          ) : menu.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center shadow">
              <AlertCircle className="mx-auto text-amber-400 mb-2" size={32} />
              <p className="text-lg font-medium text-gray-700">No menu items found.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMenu.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow p-4 flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                    <Image src={item.imageUrl || "/placeholder.svg"} alt={item.itemName} width={60} height={60} className="rounded-md object-cover" />
                    <div>
                      <div className="font-bold">{item.itemName}</div>
                      <div className="text-amber-600 font-semibold">₹{item.price.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">{item.category}</div>
                    </div>
                  </div>
                  <div className="flex-1 text-sm text-gray-600 mb-2">{item.description}</div>
                  <div className="flex items-center gap-2 mt-auto">
                    <button
                      className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded flex items-center gap-1"
                      onClick={() => addToCart(item)}
                    >
                      <PlusCircle size={16} /> Add
                    </button>
                    {cart.find((ci) => ci.item.id === item.id) && (
                      <>
                        <button
                          className="bg-gray-200 px-2 rounded"
                          onClick={() => updateCart(item.id, -1)}
                        >
                          <MinusCircle size={16} />
                        </button>
                        <span className="font-bold">
                          {cart.find((ci) => ci.item.id === item.id)?.quantity}
                        </span>
                        <button
                          className="bg-gray-200 px-2 rounded"
                          onClick={() => updateCart(item.id, 1)}
                        >
                          <PlusCircle size={16} />
                        </button>
                        <button
                          className="ml-2 text-red-500"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cart */}
          <div className="mt-8 max-w-xl mx-auto bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShoppingBag size={20} className="text-amber-500" /> Cart
                <span className="ml-2 text-sm bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-semibold">{cart.reduce((s, c) => s + c.quantity, 0)}</span>
              </h3>
              <div>
                <button className="text-sm text-gray-600 hover:underline" onClick={clearCart} disabled={cart.length === 0}>Clear Cart</button>
              </div>
            </div>

            {/* Table Number Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Table Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={tableNo}
                onChange={e => setTableNo(e.target.value)}
                onBlur={() => setTableNo(prev => prev.trim())}
                inputMode="numeric"
                pattern="[0-9]*"
                aria-label="Table number"
                placeholder="Enter table number"
                className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
              />
              {tableError && <div className="text-red-600 text-xs mt-1">{tableError}</div>}
            </div>
            {cart.length === 0 ? (
              <div className="text-gray-400 text-center py-6">No items in cart.</div>
            ) : (
              <ul className="divide-y">
                {cart.map((ci) => (
                  <li key={ci.item.id} className="py-2 flex justify-between items-center">
                    <span>{ci.item.itemName} × {ci.quantity}</span>
                    <span className="font-semibold text-amber-700">₹{(ci.item.price * ci.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-between items-center mt-4 font-bold text-lg">
              <span>Total:</span>
              <span className="text-amber-700">₹{cartTotal.toFixed(2)}</span>
            </div>
            <button
              className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              onClick={placeOrder}
              disabled={cart.length === 0 || placingOrder}
            >
              {placingOrder ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
              Place Order
            </button>
            {orderSuccess && (
              <div className="mt-3 text-green-600 flex items-center gap-2 justify-center">
                <CheckCircle size={18} /> Order placed!
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
