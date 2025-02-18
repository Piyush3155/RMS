"use client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import Link from "next/link";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [translations, setTranslations] = useState<any>({});
  const [language, setLanguage] = useState(Cookies.get("language") || "en");
  const router = useRouter();

  useEffect(() => {
    fetch("/translations.json")
      .then((res) => res.json())
      .then((data) => setTranslations(data));
  }, []);

  if (!translations[language]) {
    return <p>Loading...</p>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert(translations[language]?.passwordMismatch || "Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("/api/v1/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      console.log("API Response:", data); // ✅ Debugging

      if (!response.ok) {
        alert(translations[language]?.userExists || "Username or Email already exists");
      }

      alert(translations[language]?.registrationSuccess || "Registration successful!");

      if (data.redirectUrl) {
        setTimeout(() => {
          router.push(data.redirectUrl);
        }, 500); // 🔥 Prevents UI blocking before navigation
      } else {
        console.error("Redirect URL missing in response");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(translations[language]?.registrationFailed || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-semibold text-center text-blue-600 mb-6">
          {translations[language]?.register}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm text-gray-700">
              {translations[language]?.username}
            </label>
            <input
              type="text"
              id="username"
              placeholder={translations[language]?.usernamePlaceholder}
              className="w-full p-3 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-gray-700">
              {translations[language]?.email}
            </label>
            <input
              type="email"
              id="email"
              placeholder={translations[language]?.emailPlaceholder}
              className="w-full p-3 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-700">
              {translations[language]?.password}
            </label>
            <input
              type="password"
              id="password"
              placeholder={translations[language]?.passwordPlaceholder}
              className="w-full p-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm text-gray-700">
              {translations[language]?.confirmPassword}
            </label>
            <input
              type="password"
              id="confirmPassword"
              placeholder={translations[language]?.confirmPasswordPlaceholder}
              className="w-full p-3 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
          >
            {translations[language]?.register}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          {translations[language]?.alreadyHaveAccount}{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            {translations[language]?.loginHere}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
