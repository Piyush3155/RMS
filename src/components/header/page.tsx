"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import Logout from "../logout/page";

const Header = () => {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const savedLanguage = Cookies.get("language");
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []); // Runs once when the component mounts

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    Cookies.set("language", newLanguage, { expires: 7 }); // Save to cookies
    setLanguage(newLanguage); // Update state
    window.location.reload(); // Reload to apply changes
  };

  return (
    <div className="flex justify-between items-center bg-blue-700 p-4 text-white">
      <Link href="/" className="text-2xl font-bold">PLAY△TECH</Link>
      <nav className="flex gap-x-6 items-center">
        <Link href="/" className="hover:text-gray-300">Home</Link>
        <Link href="/about" className="hover:text-gray-300">About</Link>
        <Link href="/contact" className="hover:text-gray-300">Contact</Link>
       
        {/* Language Selector */}
        <select
          value={language}
          onChange={handleLanguageChange}
          className="bg-blue-600 text-white px-2 py-1 rounded border border-white"
        >
          <option value="en">🇺🇸 English</option>
          <option value="hi">🇮🇳 हिंदी</option>
        </select>
        <Logout />
      </nav>
    </div>
  );
};

export default Header;
