"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      const res = await fetch("/api/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      router.push("/manager");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side Image */}
      <div className="relative w-full md:w-3/5 h-64 md:h-auto">
        <Image
          src="/food.png"
          alt="Delicious food"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right Side Login with Content */}
      <div className="w-full md:w-2/5 flex flex-col justify-center p-8 md:p-12 bg-white border-l-4 border-amber-200 shadow-lg">
        {/* Bites & Co. Intro Text */}
        <div className="mb-8 text-center">
          <h1
            className="text-4xl font-bold mb-4"
            style={{ color: "#543A14", fontFamily: "Poppins, sans-serif" }}
          >
            Bites & Co.
          </h1>
          <p className="text-base text-gray-700" style={{ fontFamily: "Poppins, sans-serif" }}>
            Bringing you delightful flavors and seamless management. Log in to handle restaurant operations efficiently.
          </p>
        </div>

        {/* Login Form */}
        <h2
          className="text-2xl font-semibold text-center mb-6"
          style={{ color: "#543A14", fontFamily: "Poppins, sans-serif" }}
        >
          Admin Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-50 p-3 text-red-700 border border-red-300 rounded-md">
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1">
            <label htmlFor="email" className="text-lg font-semibold" style={{ color: "#543A14" }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-2 px-4 py-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              style={{ borderColor: "#F0BB78", fontFamily: "Poppins, sans-serif" }}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1 relative">
            <label htmlFor="password" className="text-lg font-semibold" style={{ color: "#543A14" }}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border-2 px-4 py-3 pr-12 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                style={{ borderColor: "#F0BB78", fontFamily: "Poppins, sans-serif" }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105"
            style={{ backgroundColor: "#F0BB78", color: "#543A14", fontFamily: "Poppins, sans-serif" }}
          >
            Sign In
          </button>
        </form>

        {/* Forgot Password */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-950 font-medium">
            Forgot login details?{" "}
            <a href="#" className="font-semibold hover:underline" style={{ color: "#543A14" }}>
              Contact Bites & Co.
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
