"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";

const Dashboard = () => {
  const [username, setUsername] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [translations, setTranslations] = useState<any>({});
  const [language, setLanguage] = useState(Cookies.get("language") || "en");
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  useEffect(() => {
    const cookies: Record<string, string> = document.cookie.split(";").reduce<Record<string, string>>((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    }, {});

    setUsername(cookies.username || "Guest");
    setRole(cookies.role || "user");

    fetch("/translations.json")
      .then((response) => response.json())
      .then((data) => {
        setTranslations(data);
      })
      .catch((error) => {
        console.error("Error loading translations:", error);
      });
  }, []);

  const handleAddToCart = async (itemName: string, price: number, imageUrl: string) => {
    try {
      const newItem = { itemName, price, imageUrl };
      setCart((prevCart) => [...prevCart, newItem]);

      const response = await fetch("/api/v1/add-to-cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: role === "guest" ? null : username, // Use username or guest
          itemName,
          price,
          imageUrl,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`${itemName} added to cart!`);
      } else {
        alert("Failed to add to cart!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong!");
    }
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  };

  const toggleCartModal = () => {
    setIsCartOpen(!isCartOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 via-blue-100 to-blue-200 p-8">
      <div className="relative">
        {/* Cart Icon */}
        <button
          onClick={toggleCartModal}
          className="absolute top-6 right-6 p-4 bg-gray-900 text-blue-800 text-3xl rounded-full shadow-lg hover:bg-gray-800 transition duration-300 ease-in-out"
        >
          🛒
        </button>

        <h1 className="text-6xl font-extrabold text-blue-950 text-center mb-10">Our Menu</h1>
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        {[{ name: "Schezwan Atta Noodles", price: 180, img: "/noodles.jpg" }, { name: "Chicken Tandoori", price: 350, img: "/chicken.jpg" }].map((item, index) => (
          <div key={index} className="bg-white shadow-2xl border rounded-2xl overflow-hidden w-72 transform transition-all hover:scale-105 hover:shadow-lg">
            <img src={item.img} alt={item.name} className="w-full h-48 object-cover rounded-t-xl" />
            <div className="p-6 text-center">
              <p className="text-xl font-semibold text-blue-800 mb-2">{item.name}</p>
              <p className="text-lg text-red-700 font-bold mb-4">Rs: {item.price}</p>
              <button
                onClick={() => handleAddToCart(item.name, item.price, item.img)}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out"
              >
                {translations[language]?.addToCart || "Add to Cart"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-lg w-96 transform transition-all animate-slide-up">
            <h2 className="text-4xl font-semibold text-blue-950 mb-6">Your Cart</h2>
            <div className="flex flex-col space-y-6">
              {cart.length === 0 ? (
                <p className="text-center text-gray-600">Your cart is empty.</p>
              ) : (
                cart.map((item, index) => (
                  <div key={index} className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                      <img src={item.imageUrl} alt={item.itemName} className="w-16 h-16 object-cover rounded-full" />
                      <div>
                        <p className="text-lg font-semibold text-blue-800">{item.itemName}</p>
                        <p className="text-sm text-red-700">Rs: {item.price}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(index)}
                      className="text-red-600 hover:text-red-800 text-lg"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={toggleCartModal}
              className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
