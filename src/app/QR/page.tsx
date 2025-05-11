"use client"

import { useEffect, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Plus, Trash2, Save, X } from "lucide-react"

export default function QRCodeGenerator() {
  const [origin, setOrigin] = useState("")
  const [tables, setTables] = useState<number[]>([])
  const [isAddingTable, setIsAddingTable] = useState(false)
  const [newTableNumber, setNewTableNumber] = useState("")
  const [error, setError] = useState("")

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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Table QR Codes</h2>
        <button
          onClick={handleAddTable}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} />
          Add Table
        </button>
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
          {tables.map((tableNo) => (
            <div
              key={tableNo}
              className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col items-center"
            >
              <div className="flex justify-between items-center w-full mb-3">
                <h3 className="text-lg font-bold">Table {tableNo}</h3>
                <button
                  onClick={() => handleDeleteTable(tableNo)}
                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                  aria-label={`Delete Table ${tableNo}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {origin && (
                <div className="bg-white p-2 rounded-lg border border-gray-200">
             <QRCodeCanvas
                value={`${window.location.origin}/orders?table=${tableNo}`}
                size={150}
                level="H"
                includeMargin={true}
              />

                </div>
              )}

              <p className="text-sm text-gray-500 mt-3 text-center">Scan to place an order</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
