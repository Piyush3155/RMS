"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Cookies from "js-cookie"
import Logout from "../logout/page"
import { FaUtensils, FaShoppingCart } from "react-icons/fa"

const Header = () => {
  const [language, setLanguage] = useState("en")
  const [cartItems, setCartItems] = useState(0)

  useEffect(() => {
    const savedLanguage = Cookies.get("language")
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
    // Fetch cart items count from local storage or state management
    const storedCartItems = localStorage.getItem("cartItems")
    if (storedCartItems) {
      setCartItems(JSON.parse(storedCartItems).length)
    }
  }, [])

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value
    Cookies.set("language", newLanguage, { expires: 7 })
    setLanguage(newLanguage)
    window.location.reload()
  }

  return (
    <header className="bg-amber-800 text-amber-100 shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold flex items-center">
          <FaUtensils className="mr-2" />
          <span>BITE & CO</span>
        </Link>
        <nav className="flex gap-x-6 items-center">
          <Link href="/" className="hover:text-amber-300 transition duration-200">
            Menu
          </Link>
          <Link href="/about" className="hover:text-amber-300 transition duration-200">
            About
          </Link>
          <Link href="/contact" className="hover:text-amber-300 transition duration-200">
            Contact
          </Link>

          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-amber-700 text-amber-100 px-2 py-1 rounded border border-amber-200 hover:bg-amber-600 transition duration-200"
          >
            <option value="en">🇺🇸 English</option>
            <option value="hi">🇮🇳 हिंदी</option>
          </select>

          <Link href="/cart" className="relative hover:text-amber-300 transition duration-200">
            <FaShoppingCart className="text-2xl" />
            {cartItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItems}
              </span>
            )}
          </Link>

          <Logout />
        </nav>
      </div>
    </header>
  )
}

export default Header

