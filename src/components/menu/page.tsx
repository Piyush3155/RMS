"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  MinusCircle,
  PlusCircle,
  ShoppingBag,
  X,
  ChevronLeft,
  Coffee,
  Utensils,
  Clock,
  Check,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import Image from "next/image"

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

// Function to normalize category names to prevent duplicates
const normalizeCategory = (category: string): string => {
  category = category.toLowerCase().trim()

  // Normalize vegetarian categories
  if (category.includes("veg") && !category.includes("non")) {
    return "Vegetarian"
  }

  // Normalize non-vegetarian categories
  if (category.includes("non-veg") || category.includes("nonveg")) {
    return "Non-Vegetarian"
  }

  // Normalize drinks categories
  if (category.includes("drink") || category.includes("beverage")) {
    return "Drinks"
  }

  // Normalize dessert categories
  if (category.includes("dessert") || category.includes("sweet")) {
    return "Desserts"
  }

  // Capitalize first letter for other categories
  return category.charAt(0).toUpperCase() + category.slice(1)
}

export default function OrderPage() {
  const searchParams = useSearchParams()
  const table = searchParams.get("table")
  const [cart, setCart] = useState<CartItem[]>([])
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [priceFilter, setPriceFilter] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<string>("default")

  useEffect(() => {
    if (table) {
      localStorage.setItem("tableNumber", table)
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

  // Normalize all menu item categories
  const normalizedMenu = menu.map((item) => ({
    ...item,
    normalizedCategory: normalizeCategory(item.category),
  }))

  // Get unique normalized categories
  const uniqueCategories = Array.from(new Set(normalizedMenu.map((item) => item.normalizedCategory)))
  const categories = ["all", ...uniqueCategories]

  const applyPriceFilter = (item: MenuItem & { normalizedCategory: string }) => {
    if (priceFilter === "all") return true
    if (priceFilter === "under10" && item.price < 10) return true
    if (priceFilter === "10to20" && item.price >= 10 && item.price <= 20) return true
    if (priceFilter === "over20" && item.price > 20) return true
    return false
  }

  const filteredMenu = normalizedMenu.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.normalizedCategory === selectedCategory
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPrice = applyPriceFilter(item)
    return matchesCategory && matchesSearch && matchesPrice
  })

  // Group menu items by normalized category
  const groupedMenu = filteredMenu.reduce(
    (acc, item) => {
      if (!acc[item.normalizedCategory]) {
        acc[item.normalizedCategory] = []
      }
      acc[item.normalizedCategory].push(item)
      return acc
    },
    {} as Record<string, typeof normalizedMenu>,
  )

  // Sort categories alphabetically
  const sortedCategories = Object.keys(groupedMenu).sort()

  const addToCart = (item: MenuItem & { normalizedCategory: string }) => {
    const menuItem = item
    setCart((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === item.id)

      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        )
      } else {
        return [...prev, { ...menuItem, quantity: 1 }]
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
    const lowerCategory = category.toLowerCase()
    if (lowerCategory.includes("drink")) {
      return <Coffee size={18} />
    } else if (lowerCategory.includes("veg")) {
      return <Utensils size={18} className="text-green-600" />
    } else if (lowerCategory.includes("non-veg") || lowerCategory.includes("nonveg")) {
      return <Utensils size={18} className="text-red-600" />
    } else {
      return <Utensils size={18} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white z-50 text-gray-800 p-4 sticky top-0 shadow-amber-100 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
           {/* After */}
<Image
  src="/biteandco.png"
  alt="Logo"
  width={40}
  height={40}
  className="rounded-full shadow-sm w-16 h-16 m-0 p-0"
  priority // Optional: if this is above the fold
/>
          
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative p-2 hover:bg-amber-50 rounded-full transition-colors"
            >
              <ShoppingBag className="h-6 w-6 text-amber-600" />
              {getCartItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6">
        {/* Search and Filter */}
        <div className="mb-6 sticky top-[72px] z-30 bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />

              {/* Mobile filter icon */}
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="md:hidden absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-500 transition-colors"
              >
                <Filter size={18} />
              </button>

              {/* Filter dropdown for mobile */}
              {showFilterDropdown && (
                <div className="md:hidden absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl p-4 z-50 border border-gray-100 top-full">
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Price Range</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="price"
                          checked={priceFilter === "all"}
                          onChange={() => setPriceFilter("all")}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700">All Prices</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="price"
                          checked={priceFilter === "under10"}
                          onChange={() => setPriceFilter("under10")}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700">Under ₹10</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="price"
                          checked={priceFilter === "10to20"}
                          onChange={() => setPriceFilter("10to20")}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700">₹10 - ₹20</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="price"
                          checked={priceFilter === "over20"}
                          onChange={() => setPriceFilter("over20")}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700">Over ₹20</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Sort By</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sort"
                          checked={sortOrder === "default"}
                          onChange={() => setSortOrder("default")}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700">Default</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sort"
                          checked={sortOrder === "priceLow"}
                          onChange={() => setSortOrder("priceLow")}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700">Price: Low to High</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sort"
                          checked={sortOrder === "priceHigh"}
                          onChange={() => setSortOrder("priceHigh")}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700">Price: High to Low</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop filter button */}
            <div className="hidden md:flex items-center gap-2">
              <div className="relative ml-2">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Filter size={16} />
                  Filters
                  {showFilterDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl p-4 z-50 border border-gray-100">
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Price Range</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="price"
                            checked={priceFilter === "all"}
                            onChange={() => setPriceFilter("all")}
                            className="text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm text-gray-700">All Prices</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="price"
                            checked={priceFilter === "under10"}
                            onChange={() => setPriceFilter("under10")}
                            className="text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm text-gray-700">Under ₹10</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="price"
                            checked={priceFilter === "10to20"}
                            onChange={() => setPriceFilter("10to20")}
                            className="text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm text-gray-700">₹10 - ₹20</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="price"
                            checked={priceFilter === "over20"}
                            onChange={() => setPriceFilter("over20")}
                            className="text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm text-gray-700">Over ₹20</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Sort By</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="sort"
                            checked={sortOrder === "default"}
                            onChange={() => setSortOrder("default")}
                            className="text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm text-gray-700">Default</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="sort"
                            checked={sortOrder === "priceLow"}
                            onChange={() => setSortOrder("priceLow")}
                            className="text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm text-gray-700">Price: Low to High</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="sort"
                            checked={sortOrder === "priceHigh"}
                            onChange={() => setSortOrder("priceHigh")}
                            className="text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm text-gray-700">Price: High to Low</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto mt-4 pb-2 flex-1">
            <div className="flex gap-2 min-w-max">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 transition-all ${
                    selectedCategory === category
                      ? "bg-amber-500 text-white shadow-md"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {category !== "all" && getCategoryIcon(category)}
                  {category === "all" ? "All Items" : category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <Utensils className="text-amber-500" />
            Menu
            {loading && <Clock className="animate-spin ml-2 text-amber-500" size={20} />}
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
          ) : selectedCategory !== "all" ? (
            // Single category display when a specific category is selected
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMenu.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={item.imageUrl || "/placeholder.svg"}
                      alt={item.itemName}
                      width={500} // Adjust width as needed
                      height={500} // Adjust height as needed
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      {item.normalizedCategory === "Vegetarian" && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Veg
                        </span>
                      )}
                      {item.normalizedCategory === "Non-Vegetarian" && (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Non-Veg
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-800">{item.itemName}</h3>
                      <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                        ₹{item.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                    <button
                      onClick={() => {
                        addToCart(item)
                        if (getCartItemCount() === 0) setShowCart(true)
                      }}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <PlusCircle size={18} />
                      Add to Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Categorized display for "All Items" view
            <div className="space-y-10">
              {sortedCategories.map((category) => (
                <div key={category} className="space-y-4">
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg shadow-sm ${
                      category.toLowerCase().includes("veg") && !category.toLowerCase().includes("non")
                        ? "bg-green-100 text-green-800"
                        : category.toLowerCase().includes("non-veg") || category.toLowerCase().includes("nonveg")
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {getCategoryIcon(category)}
                    <h3 className="text-xl font-bold">{category}</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedMenu[category].map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100"
                      >
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={item.imageUrl || "/placeholder.svg"}
                            alt={item.itemName}
                            width={500} // Adjust width as needed
                            height={500} // Adjust height as needed
                            className="w-full h-full object-cover transition-transform hover:scale-105"
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            {item.normalizedCategory === "Vegetarian" && (
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Veg
                              </span>
                            )}
                            {item.normalizedCategory === "Non-Vegetarian" && (
                              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                Non-Veg
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-gray-800">{item.itemName}</h3>
                            <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                              ₹{item.price.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                          <button
                            onClick={() => {
                              addToCart(item)
                              if (getCartItemCount() === 0) setShowCart(true)
                            }}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <PlusCircle size={18} />
                            Add to Order
                          </button>
                        </div>
                      </div>
                    ))}
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
            <div className="p-4 bg-amber-500 text-white flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag size={20} />
                Your Order
              </h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-white hover:text-amber-100 p-1 rounded-full hover:bg-amber-600/50 transition-colors"
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
                <div className="text-center py-12 bg-gray-50 rounded-lg my-4">
                  <ShoppingBag className="mx-auto text-gray-300 mb-3" size={48} />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h3>
                  <p className="text-gray-600 mb-6">Add some delicious items to your order</p>
                  <button
                    onClick={() => setShowCart(false)}
                    className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-6 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                  >
                    <ChevronLeft size={18} />
                    Browse Menu
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg mb-4 flex items-center gap-2">
                    <Clock size={18} className="text-blue-500" />
                    <p className="text-sm text-blue-700">Your order will be prepared as soon as you place it</p>
                  </div>

                  <ul className="divide-y divide-gray-100">
                    {cart.map((item) => (
                      <li key={item.id} className="py-4 flex items-center gap-4">
                        <Image
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.itemName}
                          width={64} // Adjust width as needed
                          height={64} // Adjust height as needed
                          className="w-16 h-16 object-cover rounded-lg shadow-sm"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{item.itemName}</h3>
                          <p className="text-amber-600 font-bold">₹{item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="text-gray-600 hover:text-gray-800 p-1 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <MinusCircle size={20} />
                          </button>
                          <span className="w-8 text-center font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="text-gray-600 hover:text-gray-800 p-1 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <PlusCircle size={20} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-lg font-bold mb-2">
                      <span className="text-gray-800">Subtotal:</span>
                      <span className="text-gray-800">₹{getCartTotal().toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm text-gray-600 mb-4">
                      <span>Service Charge (10%):</span>
                      <span>₹{(getCartTotal() * 0.1).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-xl font-bold text-amber-600 mb-6 pt-2 border-t border-gray-100">
                      <span>Total:</span>
                      <span>₹{(getCartTotal() * 1.1).toFixed(2)}</span>
                    </div>

                    <button
                      onClick={placeOrder}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
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
        {cart.length > 0 && !showCart && (
          <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center">
            <button
              onClick={() => setShowCart(true)}
              className="flex items-center justify-between bg-amber-500 text-white px-4 py-3 rounded-lg shadow-lg hover:bg-amber-600 transition-all transform hover:scale-105 w-full max-w-md mx-4"
            >
              <div className="flex items-center gap-2">
                <div className="bg-white text-amber-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  {getCartItemCount()}
                </div>
                <span className="font-medium">
                  {getCartItemCount() === 1 ? "1 item" : `${getCartItemCount()} items`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">₹{(getCartTotal() * 1.1).toFixed(2)}</span>
                <div className="flex items-center gap-1">
                  <span>View Cart</span>
                  <ShoppingBag size={16} />
                </div>
              </div>
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
