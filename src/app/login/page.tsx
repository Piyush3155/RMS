"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Coffee } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.")
      return
    }

    try {
      const res = await fetch("/api/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Login failed")

      router.push("/manager")
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unknown error occurred.")
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left Side Image with Overlay */}
      <div className="relative w-full md:w-3/5 h-64 md:h-auto overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/40 to-amber-700/40 z-10" />
        <Image
          src="/food.png"
          alt="Delicious food"
          fill
          className="object-cover object-center transition-transform duration-10000 hover:scale-105"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-white text-center p-8 max-w-xl">
            <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">Bites & Co.</h1>
            <p className="text-xl drop-shadow-md">Culinary excellence meets modern management</p>
          </div>
        </div>
      </div>

      {/* Right Side Login with Content */}
      <div className="w-full md:w-2/5 flex flex-col justify-center p-8 md:p-12 bg-white">
        <div className="max-w-md mx-auto w-full">
          {/* Logo and Welcome */}
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center mb-4">
              <Coffee size={32} className="text-amber-600 mr-2" />
              <h2 className="text-3xl font-bold text-amber-800">Bites & Co.</h2>
            </div>
            <p className="text-gray-600">Welcome back! Please log in to your admin account.</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500 text-red-700 animate-fadeIn">
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <a href="#" className="text-xs text-amber-700 hover:text-amber-800 hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Sign In
            </button>
          </form>

          {/* Contact Support */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              Need assistance?{" "}
              <a href="#" className="font-medium text-amber-700 hover:text-amber-800 hover:underline">
                Contact Support
              </a>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} Bites & Co. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
