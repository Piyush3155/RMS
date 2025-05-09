"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { MinusCircle, PlusCircle, ShoppingBag, X, ChevronLeft, Coffee, Utensils, Clock, Check, Search, Filter, ChevronDown, ChevronUp, Leaf, Drumstick } from 'lucide-react'
import Image from "next/image"

// Updated interface to include the new fields from the API
interface MenuItem {
  id: number
  itemName: string
  price: number
  description: string
  imageUrl: string
  category: string
  isVeg?: boolean
  vegSymbol?: string
  vegIndicator?: {
    type: "veg" | "non-veg"
    symbol: {
      shape: string
      color: string
      dot: boolean
    }
  }
}

interface CartItem extends MenuItem {
  normalizedCategory: string
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

export default function Menu() {
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
  const [dietFilter, setDietFilter] = useState<string>("all") // New state for veg/non-veg filter

  useEffect(() => {
    if (table) {
      window.localStorage.setItem("tableNumber", table)
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

  const applyDietFilter = (item: MenuItem & { normalizedCategory: string }) => {
    if (dietFilter === "all") return true
    if (dietFilter === "veg" && (item.isVeg === true || item.normalizedCategory === "Vegetarian")) return true
    if (dietFilter === "non-veg" && (item.isVeg === false || item.normalizedCategory === "Non-Vegetarian")) return true
    return false
  }

  const filteredMenu = normalizedMenu.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.normalizedCategory === selectedCategory
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPrice = applyPriceFilter(item)
    const matchesDiet = applyDietFilter(item)
    return matchesCategory && matchesSearch && matchesPrice && matchesDiet
  })

  // Apply sorting
  const sortedMenu = [...filteredMenu].sort((a, b) => {
    if (sortOrder === "priceLow") {
      return a.price - b.price
    } else if (sortOrder === "priceHigh") {
      return b.price - a.price
    }
    return 0
  })

  // Group menu items by normalized category
  const groupedMenu = sortedMenu.reduce(
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
    const tableNo = window.localStorage.getItem("tableNumber")
    if (!tableNo) return alert("Table number not found!")

    const orderItems = cart.map((item) => ({
      itemName: item.itemName,
      quantity: item.quantity,
      price: item.price,
    }))

    const orderData = { table: tableNo, items: orderItems, price: getCartTotal() }

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
    } else if (lowerCategory.includes("veg") && !lowerCategory.includes("non")) {
      return <Leaf size={18} className="text-green-600" />
    } else if (lowerCategory.includes("non-veg") || lowerCategory.includes("nonveg")) {
      return <Drumstick size={18} className="text-red-600" />
    } else {
      return <Utensils size={18} />
    }
  }

  // Function to render veg/non-veg indicator
  const renderVegIndicator = (item: MenuItem & { normalizedCategory: string }) => {
    // First check the API's isVeg field
    if (item.isVeg !== undefined) {
      if (item.isVeg) {
        return (
          <span className="bg-white shadow-sm text-green-600 text-xs font-medium p-1 rounded-md flex items-center justify-center">
            <span className="w-4 h-4 border border-green-600 flex items-center justify-center rounded-sm">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
            </span>
          </span>
        )
      } else {
        return (
          <span className="bg-white shadow-sm text-red-600 text-xs font-medium p-1 rounded-md flex items-center justify-center">
            <span className="w-4 h-4 border border-red-600 flex items-center justify-center rounded-sm">
              <span className="w-2 h-2 bg-red-600 rounded-full"></span>
            </span>
          </span>
        )
      }
    }
    
    // Fallback to category-based detection
    if (item.normalizedCategory === "Vegetarian") {
      return (
        <span className="bg-white shadow-sm text-green-600 text-xs font-medium p-1 rounded-md flex items-center justify-center">
          <span className="w-4 h-4 border border-green-600 flex items-center justify-center rounded-sm">
            <span className="w-2 h-2 bg-green-600 rounded-full"></span>
          </span>
        </span>
      )
    } else if (item.normalizedCategory === "Non-Vegetarian") {
      return (
        <span className="bg-white shadow-sm text-red-600 text-xs font-medium p-1 rounded-md flex items-center justify-center">
          <span className="w-4 h-4 border border-red-600 flex items-center justify-center rounded-sm">
            <span className="w-2 h-2 bg-red-600 rounded-full"></span>
          </span>
        </span>
      )
    }
    
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white z-50 text-gray-800 p-3 sticky top-0 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/biteandco.png"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-full shadow-sm w-20 h-18"
              priority
            />
            <div className="hidden md:block"> 
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>Table {window.localStorage.getItem("tableNumber") || "?"}</span>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Dine-in</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
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
        <div className="mb-6 sticky top-[72px] z-30 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
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
                    <h4 className="font-semibold text-gray-800 mb-2">Diet Preference</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="diet"
                          checked={dietFilter === "all"}
                          onChange={() => setDietFilter("all")}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700">All</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="diet"
                          checked={dietFilter === "veg"}
                          onChange={() => setDietFilter("veg")}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <div className="flex items-center gap-1">
                          <span className="w-4 h-4 border border-green-600 flex items-center justify-center rounded-sm">
                            <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                          </span>
                          <span className="text-sm text-gray-700">Vegetarian</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="diet"
                          checked={dietFilter === "non-veg"}
                          onChange={() => setDietFilter("non-veg")}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <div className="flex items-center gap-1">
                          <span className="w-4 h-4 border border-red-600 flex items-center justify-center rounded-sm">
                            <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                          </span>
                          <span className="text-sm text-gray-700">Non-Vegetarian</span>
                        </div>
                      </label>
                    </div>
                  </div>
                  
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
                      <h4 className="font-semibold text-gray-800 mb-2">Diet Preference</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="diet"
                            checked={dietFilter === "all"}
                            onChange={() => setDietFilter("all")}
                            className="text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm text-gray-700">All</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="diet"
                            checked={dietFilter === "veg"}
                            onChange={() => setDietFilter("veg")}
                            className="text-green-600 focus:ring-green-500"
                          />
                          <div className="flex items-center gap-1">
                            <span className="w-4 h-4 border border-green-600 flex items-center justify-center rounded-sm">
                              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                            </span>
                            <span className="text-sm text-gray-700">Vegetarian</span>
                          </div>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="diet"
                            checked={dietFilter === "non-veg"}
                            onChange={() => setDietFilter("non-veg")}
                            className="text-red-600 focus:ring-red-500"
                          />
                          <div className="flex items-center gap-1">
                            <span className="w-4 h-4 border border-red-600 flex items-center justify-center rounded-sm">
                              <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                            </span>
                            <span className="text-sm text-gray-700">Non-Vegetarian</span>
                          </div>
                        </label>
                      </div>
                    </div>
                    
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

          {/* Diet filter quick buttons */}
          <div className="flex gap-2 mt-3 mb-2">
            <button
              onClick={() => setDietFilter("all")}
              className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-all ${
                dietFilter === "all"
                  ? "bg-amber-500 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Utensils size={14} />
              All
            </button>
            <button
              onClick={() => setDietFilter("veg")}
              className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-all ${
                dietFilter === "veg"
                  ? "bg-green-500 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="w-3 h-3 border border-current flex items-center justify-center rounded-sm">
                <span className={`w-1.5 h-1.5 ${dietFilter === "veg" ? "bg-white" : "bg-green-600"} rounded-full`}></span>
              </span>
              Veg Only
            </button>
            <button
              onClick={() => setDietFilter("non-veg")}
              className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-all ${
                dietFilter === "non-veg"
                  ? "bg-red-500 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="w-3 h-3 border border-current flex items-center justify-center rounded-sm">
                <span className={`w-1.5 h-1.5 ${dietFilter === "non-veg" ? "bg-white" : "bg-red-600"} rounded-full`}></span>
              </span>
              Non-Veg
            </button>
          </div>

          <div className="overflow-x-auto mt-4 pb-2 flex-1">
            <div className="flex gap-3 min-w-max">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap flex items-center gap-2 transition-all ${
                    selectedCategory === category
                      ? "bg-amber-500 text-white shadow-sm"
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Utensils className="text-amber-500" />
              Menu
              {loading && <Clock className="animate-spin ml-2 text-amber-500" size={20} />}
            </h2>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <span>{filteredMenu.length}</span> items available
            </div>
          </div>

          {/* Legend for veg/non-veg indicators */}
          <div className="bg-white p-3 rounded-lg mb-4 flex flex-wrap gap-4 items-center text-sm border border-gray-100">
            <span className="font-medium text-gray-700">Indicators:</span>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 border border-green-600 flex items-center justify-center rounded-sm">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              </span>
              <span>Vegetarian</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 border border-red-600 flex items-center justify-center rounded-sm">
                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
              </span>
              <span>Non-Vegetarian</span>
            </div>
          </div>

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
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={item.imageUrl || "/placeholder.svg"}
                      alt={item.itemName}
                      width={500}
                      height={500}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 flex gap-2">
                      {renderVegIndicator(item)}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent h-16"></div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{item.itemName}</h3>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-amber-600">₹{item.price.toFixed(2)}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-sm">30-40 min</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="flex items-center text-amber-500 text-sm">
                          <span className="font-bold">4.2</span>
                          <span className="text-xs">★</span>
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          addToCart(item)
                          if (getCartItemCount() === 0) setShowCart(true)
                        }}
                        className="bg-white border border-gray-300 hover:border-amber-500 text-amber-600 font-medium py-1 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <span>ADD</span>
                        <PlusCircle size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Categorized display for "All Items" view
            <div className="space-y-10">
              {sortedCategories.map((category) => (
                <div key={category} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-2 mb-4">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category)}
                      <h3 className="text-xl font-bold text-gray-800">{category}</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {groupedMenu[category].length} items
                      </span>
                    </div>
                    <button 
                      onClick={() => setSelectedCategory(category)}
                      className="text-amber-600 text-sm font-medium hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedMenu[category].map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col"
                      >
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={item.imageUrl || "/placeholder.svg"}
                            alt={item.itemName}
                            width={500}
                            height={500}
                            className="w-full h-full object-cover transition-transform hover:scale-105"
                          />
                          <div className="absolute top-2 left-2 flex gap-2">
                            {renderVegIndicator(item)}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent h-16"></div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{item.itemName}</h3>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-amber-600">₹{item.price.toFixed(2)}</span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-sm">30-40 min</span>
                          </div>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">{item.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="flex items-center text-amber-500 text-sm">
                                <span className="font-bold">4.2</span>
                                <span className="text-xs">★</span>
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                addToCart(item)
                                if (getCartItemCount() === 0) setShowCart(true)
                              }}
                              className="bg-white border border-gray-300 hover:border-amber-500 text-amber-600 font-medium py-1 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                              <span>ADD</span>
                              <PlusCircle size={16} />
                            </button>
                          </div>
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
            <div className="bg-amber-500 text-white sticky top-0 z-10">
              <div className="p-4 flex justify-between items-center">
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
              <div className="bg-amber-600 px-4 py-2 text-sm flex justify-between">
                <span>Table {window.localStorage.getItem("tableNumber") || "?"}</span>
                <span>
                  {getCartItemCount()} {getCartItemCount() === 1 ? "item" : "items"}
                </span>
              </div>
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
                      <li key={item.id} className="py-4 flex items-start gap-3 relative">
                        <div className="min-w-[24px] mt-1">
                          {item.isVeg !== undefined ? (
                            item.isVeg ? (
                              <span className="w-5 h-5 border border-green-600 flex items-center justify-center rounded-sm">
                                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                              </span>
                            ) : (
                              <span className="w-5 h-5 border border-red-600 flex items-center justify-center rounded-sm">
                                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                              </span>
                            )
                          ) : item.normalizedCategory === "Vegetarian" ? (
                            <span className="w-5 h-5 border border-green-600 flex items-center justify-center rounded-sm">
                              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                            </span>
                          ) : item.normalizedCategory === "Non-Vegetarian" ? (
                            <span className="w-5 h-5 border border-red-600 flex items-center justify-center rounded-sm">
                              <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                            </span>
                          ) : null}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{item.itemName}</h3>
                          <p className="text-amber-600 font-bold">₹{item.price.toFixed(2)}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-1 border border-gray-300 rounded-md">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="text-amber-600 hover:text-amber-700 p-1 hover:bg-gray-100 transition-colors w-8 h-8 flex items-center justify-center"
                          >
                            <MinusCircle size={16} />
                          </button>
                          <span className="w-8 text-center font-bold text-gray-800">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="text-amber-600 hover:text-amber-700 p-1 hover:bg-gray-100 transition-colors w-8 h-8 flex items-center justify-center"
                          >
                            <PlusCircle size={16} />
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
                      <span>Service Charge (5%):</span>
                      <span>₹{(getCartTotal() * 0.05).toFixed(2)}</span>
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
              className="flex items-center justify-between bg-amber-500 text-white px-4 py-3 rounded-t-lg shadow-lg hover:bg-amber-600 transition-all w-full max-w-md mx-4"
            >
              <div className="flex items-center gap-2">
                <div className="bg-white text-amber-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  {getCartItemCount()}
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm">
                    {getCartItemCount() === 1 ? "1 item" : `${getCartItemCount()} items`}
                  </span>
                  <span className="text-xs text-amber-200">
                    Table {window.localStorage.getItem("tableNumber") || "?"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">₹{(getCartTotal() * 1.1).toFixed(2)}</span>
                <div className="flex items-center gap-1 bg-white text-amber-600 px-3 py-1 rounded-full">
                  <span className="font-medium">View Cart</span>
                  <ShoppingBag size={14} />
                </div>
              </div>
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
