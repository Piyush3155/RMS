"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { MinusCircle, PlusCircle, ShoppingBag } from "lucide-react"

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
      try {
        const res = await fetch("/api/v1/menu")
        if (!res.ok) throw new Error("Failed to fetch menu")
        const data: MenuItem[] = await res.json()
        setMenu(data)
      } catch (error) {
        console.error(error)
      }
    }

    fetchMenu()
  }, [])

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
        alert("Order placed successfully!")
        setCart([])
        console.log(orderData);
        setShowCart(false)
      } else {
        alert("Failed to place order!")
      }
    } catch (error) {
      console.error(error)
      alert("An error occurred while placing your order")
    }
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-amber-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">BITE & CO</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative p-2 bg-amber-700 rounded-full hover:bg-amber-600 transition-colors"
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
        {/* Menu Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-amber-900">Our Menu</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {menu.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <img
                  src={item.imageUrl || "/placeholder.svg"}
                  alt={item.itemName}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-amber-900">{item.itemName}</h3>
                    <span className="font-bold text-amber-800">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">{item.description}</p>
                  <button
                    onClick={() => addToCart(item)}
                    className="mt-3 w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    Add to Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Overlay */}
        {showCart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
            <div className="bg-white w-full max-w-md h-full overflow-y-auto">
              <div className="p-4 bg-amber-800 text-white flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your Order</h2>
                <button onClick={() => setShowCart(false)} className="text-white hover:text-amber-200">
                  ✕
                </button>
              </div>

              <div className="p-4">
                {cart.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">Your cart is empty</p>
                ) : (
                  <>
                    <ul className="divide-y">
                      {cart.map((item) => (
                        <li key={item.id} className="py-4 flex items-center gap-4">
                          <img
                            src={item.imageUrl || "/placeholder.svg"}
                            alt={item.itemName}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium">{item.itemName}</h3>
                            <p className="text-amber-800 font-semibold">${item.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="text-amber-700 hover:text-amber-900"
                            >
                              <MinusCircle size={20} />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="text-amber-700 hover:text-amber-900"
                            >
                              <PlusCircle size={20} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 pt-4 border-t">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>${getCartTotal().toFixed(2)}</span>
                      </div>

                      <button
                        onClick={placeOrder}
                        className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md font-medium transition-colors"
                      >
                        Place Order
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

