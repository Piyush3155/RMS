"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { MinusCircle, PlusCircle, ShoppingBag, X, ChevronLeft, Coffee, Utensils, Clock, Check } from "lucide-react"

interface MenuItem {
  id: number
  itemName: string
  price: number
  description: string
  imageUrl: string
  category: string
}

interface CartItem extends MenuItem {
  quantity: number
}

export default function OrderPage() {
  const searchParams = useSearchParams()
  const table = searchParams.get("table")
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (table) {
      localStorage.setItem("tableNumber", table)
      setSelectedTable(table)
    } else {
      const storedTable = localStorage.getItem("tableNumber")
      if (storedTable) setSelectedTable(storedTable)
    }
  }, [table])

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/v1/menu")
        if (!res.ok) throw new Error("Failed to fetch menu")
        const data: MenuItem[] = await res.json()
        setMenu(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchMenu()
  }, [])

  const categories = ["all", ...Array.from(new Set(menu.map((item) => item.category)))]

  const filteredMenu = menu.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === item.id)

      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        )
      } else {
        return [...prev, { ...item, quantity: 1 }]
      }
    })
  }

  const updateQuantity = (itemId: number, change: number) => {
    setCart((prev) => {
      const updatedCart = prev.map((item) => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + change)
          return { ...item, quantity: newQuantity }
        }
        return item
      })

      return updatedCart.filter((item) => item.quantity > 0)
    })
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  const placeOrder = async () => {
    const tableNo = localStorage.getItem("tableNumber")
    if (!tableNo) return alert("Table number not found!")

    const orderItems = cart.map((item) => ({
      itemName: item.itemName,
      quantity: item.quantity,
    }))

    const orderData = { table: tableNo, items: orderItems }

    try {
      const res = await fetch("/api/v1/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      if (res.ok) {
        setOrderPlaced(true)
        setTimeout(() => {
          setCart([])
          setOrderPlaced(false)
          setShowCart(false)
        }, 3000)
        console.log(orderData)
      } else {
        alert("Failed to place order!")
      }
    } catch (error) {
      console.error(error)
      alert("An error occurred while placing your order")
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "drinks":
        return <Coffee size={18} />
      default:
        return <Utensils size={18} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-800 to-amber-700 text-white p-4 shadow-lg sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">BITE & CO</h1>
            {selectedTable && (
              <span className="bg-amber-600 px-3 py-1 rounded-full text-sm font-medium">Table #{selectedTable}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative p-2 bg-amber-600 rounded-full hover:bg-amber-500 transition-colors"
            >
              <ShoppingBag className="h-6 w-6" />
              {getCartItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        {/* Search and Filter */}
        <div className="mb-6 sticky top-[72px] z-30 bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-2 min-w-max">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap flex items-center gap-2 ${
                      selectedCategory === category
                        ? "bg-amber-600 text-white"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                    }`}
                  >
                    {category !== "all" && getCategoryIcon(category)}
                    {category === "all" ? "All Items" : category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-amber-900 flex items-center gap-2">
            <Utensils className="text-amber-700" />
            Our Menu
            {loading && <Clock className="animate-spin ml-2 text-amber-600" size={20} />}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md h-80 animate-pulse">
                  <div className="w-full h-48 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-8 bg-gray-200 rounded w-full mt-2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMenu.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center shadow-md">
              <Utensils className="mx-auto text-amber-400 mb-3" size={48} />
              <h3 className="text-xl font-semibold text-amber-900 mb-2">No items found</h3>
              <p className="text-gray-600">
                {searchQuery ? "Try a different search term" : "No items available in this category"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMenu.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={item.imageUrl || "/placeholder.svg"}
                      alt={item.itemName}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-amber-900">{item.itemName}</h3>
                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                    <button
                      onClick={() => {
                        addToCart(item)
                        // Optional: Show cart briefly when adding first item
                        if (getCartItemCount() === 0) setShowCart(true)
                      }}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <PlusCircle size={18} />
                      Add to Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Overlay */}
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-300 z-50 ${
            showCart ? "bg-opacity-50 pointer-events-auto" : "bg-opacity-0 pointer-events-none"
          }`}
          onClick={() => setShowCart(false)}
        >
          <div
            className={`fixed top-0 right-0 bg-white w-full max-w-md h-full overflow-y-auto shadow-xl transition-transform duration-300 transform ${
              showCart ? "translate-x-0" : "translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-gradient-to-r from-amber-800 to-amber-700 text-white flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag size={20} />
                Your Order {selectedTable && `(Table #${selectedTable})`}
              </h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-white hover:text-amber-200 p-1 rounded-full hover:bg-amber-600/50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              {orderPlaced ? (
                <div className="text-center py-12 bg-green-50 rounded-lg border border-green-100 my-4">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="text-green-600" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-green-800 mb-2">Order Placed Successfully!</h3>
                  <p className="text-green-600">Your order is being prepared</p>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center py-12 bg-amber-50 rounded-lg my-4">
                  <ShoppingBag className="mx-auto text-amber-300 mb-3" size={48} />
                  <h3 className="text-xl font-semibold text-amber-800 mb-2">Your cart is empty</h3>
                  <p className="text-amber-600 mb-6">Add some delicious items to your order</p>
                  <button
                    onClick={() => setShowCart(false)}
                    className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-6 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                  >
                    <ChevronLeft size={18} />
                    Browse Menu
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-amber-50 p-3 rounded-lg mb-4 flex items-center gap-2">
                    <Clock size={18} className="text-amber-600" />
                    <p className="text-sm text-amber-800">Your order will be prepared as soon as you place it</p>
                  </div>

                  <ul className="divide-y divide-amber-100">
                    {cart.map((item) => (
                      <li key={item.id} className="py-4 flex items-center gap-4">
                        <img
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.itemName}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-amber-900">{item.itemName}</h3>
                          <p className="text-amber-800 font-bold">${item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="text-amber-700 hover:text-amber-900 p-1 hover:bg-amber-100 rounded-full"
                          >
                            <MinusCircle size={20} />
                          </button>
                          <span className="w-8 text-center font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="text-amber-700 hover:text-amber-900 p-1 hover:bg-amber-100 rounded-full"
                          >
                            <PlusCircle size={20} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 pt-4 border-t border-amber-100">
                    <div className="flex justify-between text-lg font-bold mb-2">
                      <span>Subtotal:</span>
                      <span>${getCartTotal().toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm text-gray-600 mb-4">
                      <span>Service Charge (10%):</span>
                      <span>${(getCartTotal() * 0.1).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-xl font-bold text-amber-900 mb-6 pt-2 border-t border-amber-100">
                      <span>Total:</span>
                      <span>${(getCartTotal() * 1.1).toFixed(2)}</span>
                    </div>

                    <button
                      onClick={placeOrder}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <Check size={20} />
                      Place Order
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

