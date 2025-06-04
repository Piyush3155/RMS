"use client"

import { useEffect, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Plus, Trash2, Save, X, Eye, EyeOff, Shield, Copy, Check } from "lucide-react"
import { URLEncryption } from "@/lib/encryption"

export default function QRCodeGenerator() {
  const [origin, setOrigin] = useState("")
  const [tables, setTables] = useState<number[]>([])
  const [isAddingTable, setIsAddingTable] = useState(false)
  const [newTableNumber, setNewTableNumber] = useState("")
  const [error, setError] = useState("")
  const [showEncryptedURLs, setShowEncryptedURLs] = useState(false)
  const [copiedTable, setCopiedTable] = useState<number | null>(null)

  // Load tables from localStorage on component mount
  useEffect(() => {
    setOrigin(window.location.origin)

    const savedTables = localStorage.getItem("restaurant-tables")
    if (savedTables) {
      setTables(JSON.parse(savedTables))
    } else {
      // Default tables if none saved
      const defaultTables = Array.from({ length: 9 }, (_, i) => i + 1)
      setTables(defaultTables)
      localStorage.setItem("restaurant-tables", JSON.stringify(defaultTables))
    }
  }, [])

  // Save tables to localStorage whenever they change
  useEffect(() => {
    if (tables.length > 0) {
      localStorage.setItem("restaurant-tables", JSON.stringify(tables))
    }
  }, [tables])

  const handleAddTable = () => {
    setIsAddingTable(true)
    setError("")
  }

  const handleSaveTable = () => {
    const tableNum = Number.parseInt(newTableNumber)

    // Validate input
    if (isNaN(tableNum) || tableNum <= 0) {
      setError("Please enter a valid positive number")
      return
    }

    // Check if table already exists
    if (tables.includes(tableNum)) {
      setError("This table number already exists")
      return
    }

    // Add new table and sort
    const updatedTables = [...tables, tableNum].sort((a, b) => a - b)
    setTables(updatedTables)

    // Reset form
    setNewTableNumber("")
    setIsAddingTable(false)
    setError("")
  }

  const handleDeleteTable = (tableNo: number) => {
    if (confirm(`Are you sure you want to delete Table ${tableNo}?`)) {
      const updatedTables = tables.filter((t) => t !== tableNo)
      setTables(updatedTables)
    }
  }

  const cancelAddTable = () => {
    setIsAddingTable(false)
    setNewTableNumber("")
    setError("")
  }

  const getOriginalURL = (tableNo: number) => {
    return `${origin}/orders?table=${tableNo}`
  }

  const getEncryptedURL = (tableNo: number) => {
    const originalURL = getOriginalURL(tableNo)
    return URLEncryption.encryptURL(originalURL)
  }

  const getDisplayHash = (tableNo: number) => {
    const originalURL = getOriginalURL(tableNo)
    return URLEncryption.generateDisplayHash(originalURL)
  }

  const copyToClipboard = async (text: string, tableNo: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedTable(tableNo)
      setTimeout(() => setCopiedTable(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-amber-500" />
            Secure Table QR Codes
          </h2>
          <p className="text-gray-600 text-sm mt-1">QR codes with encrypted URLs for enhanced security</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEncryptedURLs(!showEncryptedURLs)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showEncryptedURLs ? <EyeOff size={18} /> : <Eye size={18} />}
            {showEncryptedURLs ? "Hide URLs" : "Show URLs"}
          </button>
          <button
            onClick={handleAddTable}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={18} />
            Add Table
          </button>
        </div>
      </div>

      {/* Security Info Banner */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="text-blue-500 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-blue-800 mb-1">Enhanced Security Features</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• URLs are encrypted before being embedded in QR codes</li>
              <li>• Encrypted tokens expire after 24 hours for security</li>
              <li>• Original table information is hidden from direct URL access</li>
              <li>• Display hashes provide unique identifiers without revealing data</li>
            </ul>
          </div>
        </div>
      </div>

      {isAddingTable && (
        <div className="mb-6 bg-amber-50 p-4 rounded-lg border border-amber-200">
          <h3 className="text-lg font-semibold mb-3">Add New Table</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Table Number
              </label>
              <input
                type="number"
                id="tableNumber"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Enter table number"
                min="1"
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleSaveTable}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Save size={18} />
                Save
              </button>
              <button
                onClick={cancelAddTable}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {tables.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No tables available</p>
          <p className="text-gray-400 text-sm mt-1">Add tables using the button above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tables.map((tableNo) => {
            const originalURL = getOriginalURL(tableNo)
            const encryptedURL = getEncryptedURL(tableNo)
            const displayHash = getDisplayHash(tableNo)

            return (
              <div
                key={tableNo}
                className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col items-center"
              >
                <div className="flex justify-between items-center w-full mb-3">
                  <div>
                    <h3 className="text-lg font-bold">Table {tableNo}</h3>
                    <p className="text-xs text-gray-500">Hash: {displayHash}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteTable(tableNo)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                    aria-label={`Delete Table ${tableNo}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {origin && (
                  <div className="bg-white p-2 rounded-lg border border-gray-200 mb-4">
                    <QRCodeCanvas value={encryptedURL} size={150} level="H" includeMargin={true} />
                  </div>
                )}

                {/* URL Display Section */}
                {showEncryptedURLs && (
                  <div className="w-full space-y-3 mt-3 pt-3 border-t border-gray-100">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-gray-600">Original URL:</label>
                        <button
                          onClick={() => copyToClipboard(originalURL, tableNo)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="Copy original URL"
                        >
                          {copiedTable === tableNo ? (
                            <Check size={12} className="text-green-500" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-xs text-gray-700 break-all">{originalURL}</div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-amber-600">Encrypted URL:</label>
                        <button
                          onClick={() => copyToClipboard(encryptedURL, tableNo * -1)}
                          className="text-amber-400 hover:text-amber-600 p-1"
                          title="Copy encrypted URL"
                        >
                          {copiedTable === tableNo * -1 ? (
                            <Check size={12} className="text-green-500" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                      <div className="bg-amber-50 p-2 rounded text-xs text-amber-700 break-all border border-amber-200">
                        {encryptedURL}
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-500 mt-3 text-center">Scan to access encrypted menu link</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
