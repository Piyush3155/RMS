"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { MinusCircle, PlusCircle, ShoppingBag, X, ChevronLeft,  Utensils, Clock, Check, Search, Filter, Leaf, Drumstick, Heart, Star, Info, AlertCircle, Sparkles, ArrowUpDown, Receipt, Wallet, ChevronRight, Calendar, ArrowRight } from 'lucide-react'
import Image from "next/image"
import { cn } from "@/lib/utils"

import { motion, AnimatePresence } from "framer-motion"

// Types
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
  popular?: boolean
  vegSymbol?: string
  vegIndicator?: { type: "veg" | "non-veg"; symbol: { shape: string; color: string; dot: boolean } }
}

interface CartItem extends MenuItem {
  normalizedCategory: string
  quantity: number
  specialInstructions?: string
}

interface OrderItem {
  name: string
  price: number
  quantity: number
}

interface CustomerOrder {
  id: number
  orderId: number | null
  tableNumber: number
  status: string
  price: number
  createdAt: string
  items: OrderItem[]
  itemCount: number
}

// Constants
const PRICE_FILTERS = {
  all: { label: "All Prices", fn: () => true },
  under150: { label: "Under ₹150", fn: (price: number) => price < 150 },
  "150to350": { label: "₹150 - ₹350", fn: (price: number) => price >= 150 && price <= 350 },
  over350: { label: "Over ₹350", fn: (price: number) => price > 350 },
}

const SORT_OPTIONS = {
  default: { label: "Default", fn: () => 0 },
  priceLow: { label: "Price: Low to High", fn: (a: MenuItem, b: MenuItem) => a.price - b.price },
  priceHigh: { label: "Price: High to Low", fn: (a: MenuItem, b: MenuItem) => b.price - a.price },
 
}

const DIET_FILTERS = {
  all: { label: "All", fn: () => true },
  veg: {
    label: "Vegetarian",
    fn: (item: MenuItem & { normalizedCategory: string }) =>
      item.isVeg === true || item.normalizedCategory === "Vegetarian",
  },
  "non-veg": {
    label: "Non-Vegetarian",
    fn: (item: MenuItem & { normalizedCategory: string }) =>
      item.isVeg === false || item.normalizedCategory === "Non-Vegetarian",
  },
}

// Helper functions
const normalizeCategory = (category: string): string => {
  category = category.toLowerCase().trim()
  if (category.includes("veg") && !category.includes("non")) return "Vegetarian"
  if (category.includes("non-veg") || category.includes("nonveg")) return "Non-Vegetarian"
  if (category.includes("drink") || category.includes("beverage")) return "Drinks"
  if (category.includes("dessert") || category.includes("sweet")) return "Desserts"
  return category.charAt(0).toUpperCase() + category.slice(1)
}

export default function Menu() {
  // State
  const searchParams = useSearchParams()
  const [cart, setCart] = useState<CartItem[]>([])
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [priceFilter, setPriceFilter] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<string>("default")
  const [dietFilter, setDietFilter] = useState<string>("all")
  const [favorites, setFavorites] = useState<number[]>([])
  const [showSpecialInstructions, setShowSpecialInstructions] = useState<number | null>(null)
  const [specialInstructions, setSpecialInstructions] = useState<Record<number, string>>({})
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [estimatedTime, setEstimatedTime] = useState<number>(25)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState("")
  const [recentOrders, setRecentOrders] = useState<CustomerOrder[]>([])
  const [recentOrdersTotal, setRecentOrdersTotal] = useState(0)
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)

  // Effects
  useEffect(() => {
    const table = searchParams.get("table")
    if (table) window.localStorage.setItem("tableNumber", table)

    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem("favorites")
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites))

    // Load cart from localStorage
    const savedCart = localStorage.getItem("cart")
    if (savedCart) setCart(JSON.parse(savedCart))
  }, [searchParams])

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/v1/menu")
        if (!res.ok) {
          throw new Error(`Failed to fetch menu: ${res.status} ${res.statusText}`)
        }
        const data = await res.json()
        setMenu(data)
      } catch (error) {
        console.error("Error fetching menu:", error)
        setError("Failed to load menu. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchMenu()
  }, [])

  // Save favorites to localStorage when they change
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites))
  }, [favorites])

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart))
  }, [cart])

  const fetchRecentOrders = useCallback(async () => {
    const tableNo = window.localStorage.getItem("tableNumber") || "1"

    try {
      setIsLoadingOrders(true)
      const res = await fetch(`/api/v1/recentorders?table=${tableNo}`)
      if (!res.ok) throw new Error("Failed to fetch orders")

      const data = await res.json()
      setRecentOrders(data.orders)
      setRecentOrdersTotal(data.totalSpent)
      setOrderError(null)
    } catch (err) {
      console.error("Error fetching recent orders:", err)
      setOrderError("Could not load your recent orders")
    } finally {
      setIsLoadingOrders(false)
    }
  }, [])

  useEffect(() => {
    fetchRecentOrders()

    // Set up auto-refresh every 2 minutes
    const intervalId = setInterval(fetchRecentOrders, 120000)
    return () => clearInterval(intervalId)
  }, [fetchRecentOrders])

  // Derived state with memoization
  const normalizedMenu = useMemo(
    () => menu.map((item) => ({ ...item, normalizedCategory: normalizeCategory(item.category) })),
    [menu],
  )

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(normalizedMenu.map((item) => item.normalizedCategory)))
    return ["all", ...uniqueCategories]
  }, [normalizedMenu])

  const filteredMenu = useMemo(
    () =>
      normalizedMenu.filter((item) => {
        const matchesCategory = selectedCategory === "all" || item.normalizedCategory === selectedCategory
        const matchesSearch =
          item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesPrice = PRICE_FILTERS[priceFilter as keyof typeof PRICE_FILTERS].fn(item.price)
        const matchesDiet = DIET_FILTERS[dietFilter as keyof typeof DIET_FILTERS].fn(item)
        return matchesCategory && matchesSearch && matchesPrice && matchesDiet
      }),
    [normalizedMenu, selectedCategory, searchQuery, priceFilter, dietFilter],
  )

  const sortedMenu = useMemo(
    () => [...filteredMenu].sort(SORT_OPTIONS[sortOrder as keyof typeof SORT_OPTIONS].fn),
    [filteredMenu, sortOrder],
  )

  const groupedMenu = useMemo(
    () =>
      sortedMenu.reduce(
        (acc, item) => {
          if (!acc[item.normalizedCategory]) acc[item.normalizedCategory] = []
          acc[item.normalizedCategory].push(item)
          return acc
        },
        {} as Record<string, typeof normalizedMenu>,
      ),
    [sortedMenu],
  )

  const sortedCategories = useMemo(() => Object.keys(groupedMenu).sort(), [groupedMenu])

  // Cart functions
  const addToCart = (item: MenuItem & { normalizedCategory: string }) => {
    setCart((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === item.id)
      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        )
      }
      return [
        ...prev,
        {
          ...item,
          quantity: 1,
          specialInstructions: specialInstructions[item.id] || "",
        },
      ]
    })
    setShowSpecialInstructions(null)

    // Show notification
    setNotificationMessage(`${item.itemName} added to cart`)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 2000)
  }

  const updateQuantity = (itemId: number, change: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + change) } : item))
        .filter((item) => item.quantity > 0),
    )
  }

  const toggleFavorite = (itemId: number) => {
    setFavorites((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]))
  }

  const handleSpecialInstructions = (itemId: number, instructions: string) => {
    setSpecialInstructions((prev) => ({
      ...prev,
      [itemId]: instructions,
    }))
  }

  const getCartItemCount = () => cart.reduce((count, item) => count + item.quantity, 0)

  const placeOrder = async () => {
    const tableNo = window.localStorage.getItem("tableNumber") 
    const orderItems = cart.map((item) => ({
      itemName: item.itemName,
      quantity: item.quantity,
      price: item.price,
      specialInstructions: item.specialInstructions,
    }))

    try {
      const res = await fetch("/api/v1/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: tableNo,
          items: orderItems,
          price: getCartTotal(),
        }),
      })

      if (res.ok) {
        setOrderPlaced(true)
        setEstimatedTime(Math.floor(Math.random() * 20) + 20)
        setTimeout(() => {
          setCart([])
          setOrderPlaced(false)
          setShowCart(false)
        }, 3000)
      } else {
        throw new Error("Failed to place order")
      }
    } catch (error) {
      console.error("Error placing order:", error)
      alert("An error occurred while placing your order. Please try again.")
    }
  }

  // UI Helper functions
  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase()
    if (lowerCategory.includes("drink")) 
    if (lowerCategory.includes("veg") && !lowerCategory.includes("non"))
      return <Leaf size={18} className="text-emerald-600" />
    if (lowerCategory.includes("non-veg") || lowerCategory.includes("nonveg"))
      return <Drumstick size={18} className="text-rose-600" />
    
  }

  const renderVegIndicator = (item: MenuItem & { normalizedCategory: string }) => {
    const isVeg = item.isVeg !== undefined ? item.isVeg : item.normalizedCategory === "Vegetarian"

    return (
      <div className={`p-1 rounded-md ${isVeg ? "bg-emerald-50" : "bg-rose-50"}`}>
        <div
          className={`w-5 h-5 border-2 ${
            isVeg ? "border-emerald-600" : "border-rose-600"
          } flex items-center justify-center rounded-sm`}
        >
          <div className={`w-2.5 h-2.5 ${isVeg ? "bg-emerald-600 " : "bg-rose-600"} rounded-full`}></div>
        </div>
      </div>
    )
  }

  // Menu item components
  const MenuItemGrid = ({ item }: { item: MenuItem & { normalizedCategory: string } }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-gray-100 flex flex-col transform hover:-translate-y-1 duration-200"
    >
      <div className="relative h-48 overflow-hidden">
        <Image
          src={item.imageUrl || "/placeholder.svg?height=500&width=500"}
          alt={item.itemName}
          width={500}
          height={500}
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex gap-2">{renderVegIndicator(item)}</div>
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleFavorite(item.id)
            }}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md text-gray-600 hover:text-rose-500 transition-colors"
          >
            <Heart
              size={18}
              className={favorites.includes(item.id) ? "fill-rose-500 text-rose-500" : ""}
              aria-label={favorites.includes(item.id) ? "Remove from favorites" : "Add to favorites"}
            />
          </button>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent h-16"></div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{item.itemName}</h3>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-amber-600">₹{item.price.toFixed(2)}</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{item.prepTime}</span>
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">{item.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="flex items-center text-amber-500 text-sm bg-amber-50 px-2 py-0.5 rounded-full">
              <span className="font-bold">{item.rating}</span>
              <Star size={14} className="fill-amber-500 text-amber-500 ml-0.5" />
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSpecialInstructions(item.id)}
              className="bg-white border border-gray-300 text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              aria-label="Add special instructions"
            >
              <Info size={16} />
            </button>
            <button
              onClick={() => addToCart(item)}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-md w-full"
              aria-label={`Add ${item.itemName} to cart`}
            >
              <span>ADD</span>
              <PlusCircle size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )

  const MenuItemList = ({ item }: { item: MenuItem & { normalizedCategory: string } }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-gray-100 flex transform hover:-translate-y-1 duration-200"
    >
      <div className="relative w-32 h-32 overflow-hidden">
        <Image
          src={item.imageUrl || "/placeholder.svg?height=200&width=200"}
          alt={item.itemName}
          width={200}
          height={200}
          className="w-full h-full object-cover"
        />
       
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex justify-between">
          <h3 className="text-md font-bold text-gray-800">{item.itemName}</h3>
          <button
            onClick={() => toggleFavorite(item.id)}
            aria-label={favorites.includes(item.id) ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              size={16}
              className={favorites.includes(item.id) ? "fill-rose-500 text-rose-500" : "text-gray-400"}
            />
          </button>
        </div>
        <div className="flex items-center gap-2 my-1">
          <span className="font-bold text-amber-600">₹{item.price.toFixed(2)}</span>
          <div className="flex items-center text-amber-500 text-xs bg-amber-50 px-1.5 py-0.5 rounded-full">
            <span>{item.rating}</span>
            <Star size={12} className="fill-amber-500 text-amber-500 ml-0.5" />
          </div>
          <span className="text-xs text-gray-500">{item.prepTime}</span>
        </div>
        <p className="text-gray-600 text-xs line-clamp-2 flex-1">{item.description}</p>
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={() => setShowSpecialInstructions(item.id)}
            className="bg-white border border-gray-300 text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Add special instructions"
          >
            <Info size={14} />
          </button>
          <button
            onClick={() => addToCart(item)}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-medium py-1 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
            aria-label={`Add ${item.itemName} to cart`}
          >
            <span>ADD</span>
            <PlusCircle size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  )

  const handleAddPreviousOrderToCart = (items: OrderItem[]) => {
    items.forEach((item) => {
      // Find matching menu item to get full details
      const menuItem = normalizedMenu.find((menuItem) => menuItem.itemName.toLowerCase() === item.name.toLowerCase())

      if (menuItem) {
        setCart((prev) => {
          const existingItem = prev.find((cartItem) => cartItem.id === menuItem.id)
          if (existingItem) {
            return prev.map((cartItem) =>
              cartItem.id === menuItem.id ? { ...cartItem, quantity: cartItem.quantity + item.quantity } : cartItem,
            )
          }
          return [
            ...prev,
            {
              ...menuItem,
              quantity: item.quantity,
              specialInstructions: "",
            },
          ]
        })
      }
    })

    // Show notification
    setNotificationMessage(`${items.length} item(s) added to cart`)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 2000)
  }

  const getCartTotal = () => cart.reduce((total, item) => total + item.price * item.quantity, 0)

  const getOverallTotal = () => {
    const cartTotal = getCartTotal() * 1.05 // Including 5% GST
    return cartTotal + recentOrdersTotal + (recentOrdersTotal * 0.05)
  }



  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white z-50 text-gray-800 p-3 sticky top-0 shadow-md backdrop-blur-sm bg-white/90">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
           
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg shadow-md overflow-hidden">
                <Image
                  src="/biteandco.png?height=80&width=80"
                  alt="logo"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-2">
                <h1 className="font-bold text-gray-800">Bites & Co</h1>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>Table {window.localStorage.getItem("tableNumber")}</span>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span>Dine-in</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative p-2 bg-amber-50 hover:bg-amber-100 rounded-full transition-colors"
              aria-label={`View cart with ${getCartItemCount()} items`}
            >
              <ShoppingBag className="h-6 w-6 text-amber-600" />
              {getCartItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                  {getCartItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Sidebar */}
      <AnimatePresence>
        {showMobileNav && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileNav(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed top-0 left-0 h-full w-72 bg-white shadow-xl p-4 rounded-r-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                    <Image
                      src="/placeholder.svg?height=80&width=80"
                      alt="logo"
                      width={80}
                      height={80}
                      className="rounded-full"
                    />
                  </div>
                  <h2 className="ml-2 font-bold">Bites & Co</h2>
                </div>
                <button
                  onClick={() => setShowMobileNav(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="container mx-auto p-4 md:p-6">
        {/* Search and Filter */}
        <div className="mb-6 sticky top-[72px] z-30 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                aria-label="Search menu"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>

            {/* View toggle and filter buttons */}
            <div className="flex items-center gap-2">
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}
                  aria-label="Grid view"
                >
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="w-2 h-2 bg-gray-500 rounded-sm"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-sm"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-sm"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-sm"></div>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded ${viewMode === "list" ? "bg-white shadow-sm" : ""}`}
                  aria-label="List view"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="w-6 h-1.5 bg-gray-500 rounded-sm"></div>
                    <div className="w-6 h-1.5 bg-gray-500 rounded-sm"></div>
                    <div className="w-6 h-1.5 bg-gray-500 rounded-sm"></div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="p-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                aria-label="Filter and sort"
              >
                <Filter size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Sticky category navigation */}
        <div className="sticky top-[140px] z-20 bg-white/90 backdrop-blur-sm shadow-lg rounded-xl p-2 mb-6 border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-2 px-2">Categories</h3>
          <div className="overflow-x-auto pb-2 flex-1">
            <div className="flex gap-3 min-w-max">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-4 py-2 rounded-full whitespace-nowrap flex items-center gap-2 transition-all",
                    selectedCategory === category
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
                  )}
                  aria-label={`Show ${category === "all" ? "all items" : category + " items"}`}
                >
                  {category !== "all" && getCategoryIcon(category)}
                  {category === "all" ? "All Items" : category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Diet filter quick buttons - Modern style */}
<div className="flex gap-3 mt-4 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setDietFilter("all")}
            className={cn(
              "px-2 py-1 md:px-4 md:py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-sm whitespace-nowrap", // Added whitespace-nowrap
              dietFilter === "all"
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
            )}
            aria-label="Show all items"
          >
            <Utensils size={16} />
            All
          </button>

          <button
            onClick={() => setDietFilter("veg")}
            className={cn(
              "px-2 py-1 md:px-6 md:py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-sm whitespace-nowrap", // Added whitespace-nowrap
              dietFilter === "veg"
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                : "bg-white border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50",
            )}
            aria-label="Show vegetarian items only"
          >
            <div className="w-4 h-4 border-2 border-current flex items-center justify-center rounded-sm bg-white">
              <div className={`w-2 h-2 ${dietFilter === "veg" ? "bg-white" : "bg-emerald-600"} rounded-full`}></div>
            </div>
            {/* Added whitespace-nowrap to the h1 for extra safety, though on the button should suffice */}
            <h1 className="text-sm md:sm whitespace-nowrap">Veg Only</h1>
          </button>

          <button
            onClick={() => setDietFilter("non-veg")}
            className={cn(
              "px-2 py-1 md:px-4 md:py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-sm whitespace-nowrap", // Added whitespace-nowrap
              dietFilter === "non-veg"
                ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white"
                : "bg-white border-2 border-rose-500 text-rose-700 hover:bg-rose-50",
            )}
            aria-label="Show non-vegetarian items only"
          >
            <div className="w-4 h-4 border-2 border-current flex items-center justify-center rounded-sm bg-white">
              <div className={`w-2 h-2 ${dietFilter === "non-veg" ? "bg-white" : "bg-rose-600"} rounded-full`}></div>
            </div>
            Non-Veg
          </button>

          <button
              onClick={() => {
                if (sortOrder === "priceLow") {
                  setSortOrder("priceHigh")
                } else if (sortOrder === "priceHigh") {
                  setSortOrder("default")
                } else {
                  setSortOrder("priceLow")
                }
              }}
                className={cn(
                  "px-2 py-1 md:px-4 md:py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-sm whitespace-nowrap", // Added whitespace-nowrap
                  sortOrder === "priceLow" || sortOrder === "priceHigh"
                    ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white"
                    : "bg-white border border-sky-500 text-sky-700 hover:bg-sky-50",
                )}
                aria-label="Sort by price"
              >
                <ArrowUpDown size={16} />
                {sortOrder === "priceLow" ? "Price: Low to High" : sortOrder === "priceHigh" ? "Price: High to Low" : "Sort by Price"}
              </button>
        </div>
        {/* Filter Dropdown */}
        <AnimatePresence>
          {showFilterDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-200 relative z-30"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Filter size={16} />
                  Filters & Sorting
                </h3>
                <button onClick={() => setShowFilterDropdown(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Sort By</h4>
                  <div className="space-y-2">
                    {Object.entries(SORT_OPTIONS).map(([key, { label }]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sort"
                          checked={sortOrder === key}
                          onChange={() => setSortOrder(key)}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Price Range</h4>
                  <div className="space-y-2">
                    {Object.entries(PRICE_FILTERS).map(([key, { label }]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="price"
                          checked={priceFilter === key}
                          onChange={() => setPriceFilter(key)}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setSortOrder("default")
                    setPriceFilter("all")
                    setDietFilter("all")
                    setShowFilterDropdown(false)
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setShowFilterDropdown(false)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg text-sm shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="text-amber-500" />
              Menu
              {loading && <Clock className="animate-spin ml-2 text-amber-500" size={20} />}
            </h2>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <span>{filteredMenu.length}</span> items available
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center mb-6">
              <AlertCircle className="mx-auto text-rose-500 mb-3" size={32} />
              <h3 className="text-xl font-semibold text-rose-800 mb-2">Something went wrong</h3>
              <p className="text-rose-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-rose-600 hover:bg-rose-700 text-white py-2 px-6 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg h-80 animate-pulse">
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
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
              <Utensils className="mx-auto text-amber-400 mb-3" size={48} />
              <h3 className="text-xl font-semibold text-amber-900 mb-2">No items found</h3>
              <p className="text-gray-600">
                {searchQuery ? "Try a different search term" : "No items available in this category"}
              </p>
            </div>
          ) : selectedCategory !== "all" ? (
            // Single category display
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMenu.map((item) => (
                  <MenuItemGrid key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMenu.map((item) => (
                  <MenuItemList key={item.id} item={item} />
                ))}
              </div>
            )
          ) : (
            // Categorized display
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
                      className="text-amber-600 text-sm font-medium hover:underline flex items-center gap-1"
                      aria-label={`View all ${category} items`}
                    >
                      View All
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {groupedMenu[category].map((item) => (
                        <MenuItemGrid key={item.id} item={item} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groupedMenu[category].map((item) => (
                        <MenuItemList key={item.id} item={item} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Special Instructions Modal */}
        <AnimatePresence>
          {showSpecialInstructions !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
              >
                <h3 className="text-lg font-bold mb-4">Special Instructions</h3>
                <textarea
                  className="w-full border border-gray-300 rounded-xl p-3 h-32 mb-4 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Any special requests? (e.g., no onions, extra spicy)"
                  value={specialInstructions[showSpecialInstructions] || ""}
                  onChange={(e) => handleSpecialInstructions(showSpecialInstructions, e.target.value)}
                  aria-label="Special instructions"
                ></textarea>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowSpecialInstructions(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const item = normalizedMenu.find((item) => item.id === showSpecialInstructions)
                      if (item) addToCart(item)
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg shadow-sm"
                  >
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart Overlay */}
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-300 z-50 ${
            showCart ? "bg-opacity-50 backdrop-blur-sm pointer-events-auto" : "bg-opacity-0 pointer-events-none"
          }`}
          onClick={() => setShowCart(false)}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: showCart ? 0 : "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed top-0 right-0 bg-white w-full max-w-md h-full overflow-y-auto shadow-xl rounded-l-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white sticky top-0 z-10 rounded-tl-2xl">
              <div className="p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingBag size={20} />
                  Your Order
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-white hover:text-amber-100 p-1 rounded-full hover:bg-amber-600/50 transition-colors"
                  aria-label="Close cart"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="bg-orange-600/50 px-4 py-2 text-sm flex justify-between">
                <span>Table {window.localStorage.getItem("tableNumber") || "1"}</span>
                <span>
                  {getCartItemCount()} {getCartItemCount() === 1 ? "item" : "items"}
                </span>
              </div>
            </div>

            <div className="p-4">
              {/* Recent Orders Section - Modernized */}
              {isLoadingOrders ? (
                <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse mb-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
                    ))}
                  </div>
                </div>
              ) : orderError ? (
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center mb-6">
                  <AlertCircle className="mx-auto text-rose-500 mb-2" size={24} />
                  <p className="text-rose-600 mb-3">{orderError}</p>
                  <button
                    onClick={fetchRecentOrders}
                    className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Clock size={16} />
                    Try Again
                  </button>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center mb-6">
                  <Receipt className="mx-auto text-gray-400 mb-3" size={32} />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Previous Orders</h3>
                  <p className="text-gray-600">Your order history will appear here</p>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Receipt size={18} className="text-amber-600" />
                      Recent Orders
                    </h2>
                    <button
                      onClick={fetchRecentOrders}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                      aria-label="Refresh orders"
                    >
                      <Clock size={16} className={isLoadingOrders ? "animate-spin" : ""} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100"
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="bg-amber-50 p-2 rounded-lg">
                                <Receipt size={18} className="text-amber-600" />
                              </div>
                              <div>
                                <div className="font-bold text-gray-800">Order #{order.orderId || order.id}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar size={12} />
                                  {formatDate(order.createdAt)}
                                </div>
                              </div>
                            </div>
                            
                          </div>

                          <div className="flex justify-between items-center mt-3">
                            <div className="flex flex-wrap gap-1.5">
                              {order.items.slice(0, expandedOrder === order.id ? undefined : 2).map((item, idx) => (
                                <span
                                  key={idx}
                                  className="bg-amber-50 px-2 py-0.5 rounded-full text-amber-700 text-xs font-medium"
                                >
                                  {item.quantity}× {item.name}
                                </span>
                              ))}
                              {expandedOrder !== order.id && order.items.length > 2 && (
                                <button
                                  onClick={() => setExpandedOrder(order.id)}
                                  className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-700 text-xs font-medium flex items-center gap-0.5"
                                >
                                  +{order.items.length - 2} more
                                  <ChevronRight size={12} />
                                </button>
                              )}
                            </div>
                            <div className="font-bold text-amber-600">₹{order.price.toFixed(2)}</div>
                          </div>

                          {expandedOrder === order.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 pt-3 border-t border-gray-100"
                            >
                              <div className="text-sm font-medium text-gray-700 mb-2">Order Details</div>
                              <ul className="space-y-2">
                                {order.items.map((item, idx) => (
                                  <li key={idx} className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                      {item.quantity}× {item.name}
                                    </span>
                                    <span className="text-gray-800 font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={() => setExpandedOrder(null)}
                                  className="text-xs text-gray-500 flex items-center gap-1"
                                >
                                  Show less
                                  <ChevronRight size={12} className="rotate-90" />
                                </button>
                              </div>
                            </motion.div>
                          )}

                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => handleAddPreviousOrderToCart(order.items)}
                              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <span>Order Again</span>
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Overall spending summary */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Wallet size={18} className="text-amber-600" />
                        <span className="font-medium text-amber-800">Overall Spending</span>
                      </div>
                      
                      <div className="font-bold text-amber-700 text-lg">₹{(recentOrdersTotal + recentOrdersTotal * 0.05).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}

              {orderPlaced ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12 bg-emerald-50 rounded-xl border border-emerald-100 my-4"
                >
                  <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="text-emerald-600" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-800 mb-2">Order Placed Successfully!</h3>
                  <p className="text-emerald-600 mb-2">Your order is being prepared</p>
                  <div className="bg-emerald-100 p-3 rounded-lg inline-block">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <Clock size={18} />
                      <span>Estimated delivery: {estimatedTime} minutes</span>
                    </div>
                  </div>
                </motion.div>
              ) : cart.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl my-4">
                  <ShoppingBag className="mx-auto text-gray-300 mb-3" size={48} />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h3>
                  <p className="text-gray-600 mb-6">Add some delicious items to your order</p>
                  <button
                    onClick={() => setShowCart(false)}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-2 px-6 rounded-lg transition-colors flex items-center gap-2 mx-auto shadow-sm"
                  >
                    <ChevronLeft size={18} />
                    Browse Menu
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-sky-50 border border-sky-100 p-3 rounded-lg mb-4 flex items-center gap-2">
                    <Clock size={18} className="text-sky-500" />
                    <p className="text-sm text-sky-700">Your order will be prepared as soon as you place it</p>
                  </div>

                  <ul className="divide-y divide-gray-100">
                    {cart.map((item) => (
                      <motion.li
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="py-4 flex items-start gap-3 relative"
                      >
                        <div className="min-w-[24px] mt-1">{renderVegIndicator(item)}</div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{item.itemName}</h3>
                          <p className="text-amber-600 font-bold">₹{item.price.toFixed(2)}</p>
                          {item.specialInstructions && (
                            <p className="text-xs italic text-gray-500 mt-1 bg-gray-50 p-2 rounded-lg">
                              {item.specialInstructions}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 border border-gray-300 rounded-md">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="text-amber-600 hover:text-amber-700 p-1 hover:bg-gray-100 transition-colors w-8 h-8 flex items-center justify-center"
                            aria-label={`Decrease quantity of ${item.itemName}`}
                          >
                            <MinusCircle size={16} />
                          </button>
                          <span className="w-8 text-center font-bold text-gray-800">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="text-amber-600 hover:text-amber-700 p-1 hover:bg-gray-100 transition-colors w-8 h-8 flex items-center justify-center"
                            aria-label={`Increase quantity of ${item.itemName}`}
                          >
                            <PlusCircle size={16} />
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </ul>

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-lg font-bold mb-2">
                      <span className="text-gray-800">Subtotal:</span>
                      <span className="text-gray-800">₹{getCartTotal().toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>GST (5%):</span>
                      <span>₹{(getCartTotal() * 0.05).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-lg font-semibold text-amber-700 mb-4 pt-2 border-t border-dashed border-amber-200">
                      <span>Total:</span>
                      <span>₹{(getCartTotal() * 1.05).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm text-gray-600 mt-4 pt-2 border-t border-gray-100">
                      <span className="flex items-center gap-1">
                        <Receipt size={14} />
                        Previous Orders:
                      </span>
                      <span>₹{(recentOrdersTotal + recentOrdersTotal * 0.05).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-xl font-bold text-orange-600 mt-2 pt-2 border-t border-gray-100">
                      <span className="flex items-center gap-1">
                        <Wallet size={18} />
                        Overall Total:
                      </span>
                      <span>₹{getOverallTotal().toFixed(2)}</span>
                    </div>

                    <button
                      onClick={placeOrder}
                      className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-3 px-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      <Check size={20} />
                      Place Order
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Floating cart button */}
        <AnimatePresence>
          {getCartItemCount() > 0 && !showCart && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-4 left-0 right-0 z-40 flex justify-center"
            >
              <button
                onClick={() => setShowCart(true)}
                className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-3 rounded-xl shadow-xl hover:from-amber-600 hover:to-orange-700 transition-all w-full max-w-md mx-4 border-2 border-amber-300"
                aria-label={`View cart with ${getCartItemCount()} items`}
              >
                <div className="flex items-center gap-2">
                  <div className="bg-white text-amber-600 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                    {getCartItemCount()}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">
                      {getCartItemCount() === 1 ? "1 item" : `${getCartItemCount()} items`}
                    </span>
                    <span className="text-xs text-amber-200">
                      Table {window.localStorage.getItem("tableNumber") || "1"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="font-bold">₹{(getCartTotal() * 1.05).toFixed(2)}</span>
                    <span className="text-xs text-amber-200">Inc. 5% GST</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white text-amber-600 px-3 py-1 rounded-full font-bold">
                    <span>View Cart</span>
                    <ShoppingBag size={14} />
                  </div>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-20 left-0 right-0 flex justify-center z-50 pointer-events-none"
            >
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                <Check size={16} className="text-green-400" />
                <span>{notificationMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}