"use client"

import { useEffect, useState } from "react"
import Cookies from "js-cookie"
import { FaSearch, FaTrash, FaShoppingCart, FaStar } from "react-icons/fa"
import { motion } from "framer-motion"
import Link from "next/link"
import Logout from "../logout/page"
import PopupMessage from "../../components/PopupMessage/page"

const Dashboard = () => {
  const [username, setUsername] = useState<string>("")
  const [role, setRole] = useState<string>("")
  const [translations, setTranslations] = useState<any>({})
  const [language, setLanguage] = useState(Cookies.get("language") || "en")
  const [cart, setCart] = useState<any[]>([])
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filter, setFilter] = useState<string>("All")
  const [popupMessage, setPopupMessage] = useState<string>("")
  const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false)

  useEffect(() => {
    const cookies: Record<string, string> = document.cookie.split(";").reduce<Record<string, string>>((acc, cookie) => {
      const [key, value] = cookie.trim().split("=")
      acc[key] = value
      return acc
    }, {})

    setUsername(cookies.username || "Guest")
    setRole(cookies.role || "user")

    fetch("/translations.json")
      .then((response) => response.json())
      .then((data) => {
        setTranslations(data)
      })
      .catch((error) => {
        console.error("Error loading translations:", error)
      })
  }, [])

  const menuItems = [
    {
      name: "Schezwan Atta Noodles",
      price: 180,
      imageUrl: "/noodles.jpg?height=300&width=400",
      category: "Veg",
      description: "Spicy and flavorful wheat-based noodles tossed with vegetables and Schezwan sauce.",
    },
    {
      name: "Chicken Tandoori",
      price: 350,
      imageUrl: "/chicken.jpg?height=300&width=400",
      category: "Non-Veg",
      description: "Spicy and flavorful wheat-based noodles tossed with vegetables and Schezwan sauce.",
    },
    {
      name: "Vegetable Biryani",
      price: 220,
      imageUrl: "/vegbiryani.jpg?height=300&width=400",
      category: "Veg",
      description: "Spicy and flavorful wheat-based noodles tossed with vegetables and Schezwan sauce.",
    },
    {
      name: "Butter Chicken",
      price: 380,
      imageUrl: "/butterchicken.jpg?height=300&width=400",
      category: "Non-Veg",
      description: "Spicy and flavorful wheat-based noodles tossed with vegetables and Schezwan sauce.",
    },
    {
      name: "Paneer Tikka",
      price: 250,
      imageUrl: "/paneertikka.jpg?height=300&width=400",
      category: "Veg",
      description: "Spicy and flavorful wheat-based noodles tossed with vegetables and Schezwan sauce.",
    },
    {
      name: "Fish Curry",
      price: 400,
      imageUrl: "/fishcurry.jpg?height=300&width=400",
      category: "Non-Veg",
      description: "Spicy and flavorful wheat-based noodles tossed with vegetables and Schezwan sauce.",
    },
    {
      name: "Chicken Biryani",
      price: 180,
      imageUrl: "/chickenbiryani.jpg?height=300&width=400",
      category: "Non-Veg",
      description: "Spicy and flavorful wheat-based noodles tossed with vegetables and Schezwan sauce.",
    },
    {
      name: "Roti",
      price: 30,
      imageUrl: "/roti.jpg?height=300&width=400",
      category: "veg",
      description: "Spicy and flavorful wheat-based noodles tossed with vegetables and Schezwan sauce.",
    },
    {
      name: "Butter Naan",
      price: 30,
      imageUrl: "/roti.jpg?height=300&width=400",
      category: "Veg",
      description: "Spicy and flavorful wheat-based noodles tossed with vegetables and Schezwan sauce.",
    },
    {
      name: "Masala Papad",
      price: 30,
      imageUrl: "/roti.jpg?height=300&width=400",
      category: "Veg",
      description: "Spicy and flavorful wheat-based noodles tossed with vegetables and Schezwan sauce.",
    },
    {
      name: "Veg Kadhai",
      price: 30,
      imageUrl: "/roti.jpg?height=300&width=400",
      category: "Veg",
      description: "Spicy and flavorful wheat-based noodles tossed with vegetables and Schezwan sauce.",
    },
    {
      name: "Paneer Kabab",
      price: 30,
      imageUrl: "/roti.jpg?height=300&width=400",
      category: "Veg",
      description: "Spicy and flavorful wheat-based noodles tossed with vegetables and Schezwan sauce.",
    },
    {
      name: "Chicken Kabab",
      price: 30,
      imageUrl: "/roti.jpg?height=300&width=400",
      category: "Non-Veg",
      description: "Spicy and flavorful wheat-based noodles tossed with vegetables and Schezwan sauce.",
    },
    {
      name: "Chicken Shawarma",
      price: 30,
      imageUrl: "/roti.jpg?height=300&width=400",
      category: "Non-veg",
      description: "Spicy and flavorful wheat-based noodles tossed with vegetables and Schezwan sauce.",
    },
  ]

  const reviews = [
    { name: "John Doe", rating: 5, comment: "Excellent food and service!" },
    { name: "Jane Smith", rating: 4, comment: "Great variety of dishes. Loved the ambiance." },
    { name: "Mike Johnson", rating: 5, comment: "The best Indian cuisine I've had in years!" },
  ]

  const handleAddToCart = (itemName: string, price: number, imageUrl: string) => {
    const existingItem = cart.find((item) => item.itemName === itemName)
    if (existingItem) {
      setCart(cart.map((item) => (item.itemName === itemName ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      setCart([...cart, { itemName, price, imageUrl, quantity: 1 }])
    }
    setPopupMessage(`${itemName} added to cart!`)
    setIsPopupVisible(true)
    setTimeout(() => setIsPopupVisible(false), 3000)
  }

  const handleQuantityChange = (index: number, newQuantity: number) => {
    setCart(cart.map((item, i) => (i === index ? { ...item, quantity: newQuantity } : item)))
  }

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const toggleCartModal = () => {
    setIsCartOpen(!isCartOpen)
  }

  const filteredItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) && (filter === "All" || item.category === filter),
  )

  const placeOrder = async () => {
    if (cart.length === 0) return

    const orderData = {
      username,
      items: cart,
      totalAmount: cart.reduce((total, item) => total + item.price * item.quantity, 0),
    }

    try {
      const response = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (response.ok) {
        setPopupMessage("Order placed successfully!")
        setIsPopupVisible(true)
        setTimeout(() => setIsPopupVisible(false), 3000)
        setCart([]) // Clear cart after successful order
      } else {
        setPopupMessage(`Error: ${data.error}`)
        setIsPopupVisible(true)
        setTimeout(() => setIsPopupVisible(false), 3000)
      }
    } catch (error) {
      console.error("Error placing order:", error)
      setPopupMessage("Error placing order. Please try again.")
      setIsPopupVisible(true)
      setTimeout(() => setIsPopupVisible(false), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Hero Section */}
      <header className="bg-white shadow-md fixed w-full z-50 top-0 mb-16">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-orange-600">BITE & CO</h1>
          <div className="flex items-center space-x-4">
            <button onClick={toggleCartModal} className="relative">
              <FaShoppingCart className="text-2xl text-gray-600" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
            <Logout />
            {role === "admin" && (
              <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto p-8">
        {/* Cart Icon */}

        <h1 className="text-5xl font-extrabold text-amber-900 text-center my-10">Our Menu</h1>

        {/* Search Bar and Filter */}

        {/* Menu Items Grid */}

        <main className="container mx-auto px-4 py-8 text-black">
          <div className="flex justify-between items-center mb-8">
            <div className="relative w-1/2">
              <input
                type="text"
                placeholder="Search for dishes..."
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg"
            >
              <option value="All">All</option>
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <img src={item.imageUrl || "/placeholder.svg"} alt={item.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                  <p className="text-gray-600 mb-2">{item.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">₹{item.price}</span>
                    <button
                      onClick={() => handleAddToCart(item.name, item.price, item.imageUrl)}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-300"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </main>

        {/* Cart */}
        {isCartOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-black">
            <div className="bg-white rounded-lg p-6 w-96">
              <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
              {cart.length > 0 ? (
                <>
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-center mb-4">
                      <div>
                        <p className="font-semibold">{item.itemName}</p>
                        <p className="text-gray-600">
                          ₹{item.price} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => handleQuantityChange(index, Math.max(1, item.quantity - 1))}
                          className="bg-gray-200 px-2 py-1 rounded-l"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 bg-gray-100">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(index, item.quantity + 1)}
                          className="bg-gray-200 px-2 py-1 rounded-r"
                        >
                          +
                        </button>
                        <button onClick={() => handleRemoveFromCart(index)} className="ml-2 text-red-500">
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 border-t pt-4">
                    <p className="text-xl font-bold">
                      Total: ₹{cart.reduce((total, item) => total + item.price * item.quantity, 0)}
                    </p>
                  </div>
                  <button
                    onClick={placeOrder}
                    className="mt-4 w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition duration-300"
                  >
                    Place Order
                  </button>
                </>
              ) : (
                <p>Your cart is empty.</p>
              )}
              <button
                onClick={toggleCartModal}
                className="mt-4 w-full bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition duration-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
        {/* About Section */}
        <div className="mt-20">
          <h2 className="text-4xl font-bold text-amber-900 text-center mb-8">About Us</h2>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              Welcome to Spice Haven, where culinary excellence meets warm hospitality. Our restaurant is a celebration
              of authentic Indian flavors, blending traditional recipes with modern culinary techniques. We take pride
              in sourcing the finest ingredients to create dishes that tantalize your taste buds and transport you to
              the vibrant streets of India.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mt-4">
              Our team of expert chefs brings years of experience and passion to every dish, ensuring a memorable dining
              experience for our guests. Whether you're a fan of fiery curries, tender tandoori specialties, or aromatic
              biryanis, our diverse menu has something to satisfy every palate.
            </p>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-20">
          <h2 className="text-4xl font-bold text-amber-900 text-center mb-8">Customer Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((review, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {review.name[0]}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">{review.name}</h3>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-300"} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600">{review.comment}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-amber-900 text-white py-8 mt-20">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">BITE & CO</h3>
              <p>Authentic Indian Cuisine</p>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-4">Contact Us</h4>
              <p>123 Spice Street, Flavortown</p>
              <p>Phone: (555) 123-4567</p>
              <p>Email: info@spicehaven.com</p>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-4">Opening Hours</h4>
              <p>Monday - Friday: 11am - 10pm</p>
              <p>Saturday - Sunday: 12pm - 11pm</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p>&copy; 2025 BITE & CO. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <PopupMessage message={popupMessage} isVisible={isPopupVisible} />
    </div>
  )
}

export default Dashboard

