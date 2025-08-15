"use client"

import { useEffect, useState, useRef } from "react"
import { Loader2, Utensils, CheckCircle, ShoppingBag, PlusCircle, MinusCircle, Check, AlertCircle, Search, Leaf, Drumstick } from "lucide-react"
import Image from "next/image"
import { toast } from "react-toastify"

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

  // Add state for updating order status
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Preload notification audio
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    notificationAudioRef.current = typeof window !== "undefined" ? new Audio("/sounds/notification.mp3") : null
    if (notificationAudioRef.current) notificationAudioRef.current.volume = 0.9
    return () => {
      if (notificationAudioRef.current) {
        try { notificationAudioRef.current.pause(); notificationAudioRef.current.src = "" } catch {}
        notificationAudioRef.current = null
      }
    }
  }, [])

  // Fetch ready-to-serve orders
  useEffect(() => {
    async function fetchOrders() {
      setLoadingOrders(true)
      try {
        const res = await fetch("/api/v1/kitchenorders")
        const data = await res.json()
        setOrders(data.filter((o: Order) => o.status === "completed"))
      } catch {
        setOrders([])
      }
      setLoadingOrders(false)
    }
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000)

    // Setup SSE for realtime order updates (listen for order-updated/new-order)
    const sseHost = (window as Window & { __SSE_HOST__?: string }).__SSE_HOST__ || `${window.location.protocol}//${window.location.hostname}:4000`
    const es = new EventSource(`${sseHost}/events`)

    const handleIncoming = (ev: MessageEvent) => {
      try {
        const payload = JSON.parse(ev.data)
        const kOrder = payload?.kitchenOrder ?? payload?.order
        if (!kOrder) return

        const mapped = {
          id: kOrder.id,
          tableNumber: kOrder.tableNumber ?? payload.tableNumber,
          items: kOrder.items ?? payload.items ?? [],
          status: kOrder.status ?? payload.status ?? "pending",
          timestamp: kOrder.timestamp ?? kOrder.createdAt ?? new Date().toISOString(),
        }

        // If order is completed, play audio and ensure it appears in the ready-to-serve list
        if (mapped.status === "completed") {
          // play notification sound (best-effort)
          if (notificationAudioRef.current) {
            notificationAudioRef.current.currentTime = 0
            notificationAudioRef.current.play().catch(() => {})
          }

          // Add or update in the orders list
          setOrders((prev) => {
            const exists = prev.find((o) => String(o.id) === String(mapped.id))
            if (exists) {
              return prev.map((o) => (String(o.id) === String(mapped.id) ? mapped : o))
            }
            // prepend newest completed orders
            return [mapped, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          })

          toast.success(`Order ready — Table ${mapped.tableNumber}`)
        } else {
          // if status changed for an order that is currently in the list (e.g., served), update/remove it
          setOrders((prev) => {
            if (mapped.status !== "completed") {
              return prev.filter((o) => String(o.id) !== String(mapped.id))
            }
            return prev
          })
        }
      } catch (err) {
        console.warn("SSE waiter parse error:", err)
      }
    }

    es.addEventListener("order-updated", handleIncoming)
    es.addEventListener("new-order", handleIncoming) // fallback: some events may be 'new-order'

    es.onerror = (err) => {
      console.warn("Waiter SSE error:", err)
      try { es.close() } catch {}
    }

    return () => {
      clearInterval(interval)
      try { es.close() } catch {}
    }
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
    if (cart.length === 0) return
    if (!tableNo.trim()) {
      setTableError("Please enter table number")
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
        body: JSON.stringify({ table: tableNo.trim(), items, price: cartTotal }),
      })
      if (!res.ok) throw new Error("Order failed")
      setOrderSuccess(true)
      setCart([])
      setTimeout(() => setOrderSuccess(false), 2000)
    } catch {
      alert("Failed to place order")
    }
    setPlacingOrder(false)
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
    } catch {
      alert("Failed to update order status");
    }
    setUpdatingOrderId(null);
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow p-4 flex items-center gap-4">
        <Image src="/biteandco.png" alt="Logo" width={40} height={40} className="rounded-lg" />
        <h1 className="text-2xl font-bold text-gray-800">Waiter Dashboard</h1>
      </header>

      <main className="container mx-auto py-6 px-4">
        {/* Orders to be served */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Utensils className="text-blue-500" /> Orders Ready to Serve
          </h2>
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
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <ShoppingBag size={20} className="text-amber-500" /> Cart
            </h3>
            {/* Table Number Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Table Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={tableNo}
                onChange={e => setTableNo(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Enter table number"
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
