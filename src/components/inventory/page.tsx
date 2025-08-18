"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, AlertTriangle, FileText, Truck, Users, Package, BarChart2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface InventoryItem {
  id: number
  name: string
  category: string
  unit: string
  sku: string
  quantity: number
  reorderLevel: number
  maxCapacity: number
  variants?: { size: string; quantity: number }[]
  supplierId?: number
  supplier?: Supplier
}

interface Supplier {
  id: number
  name: string
  contact: string
  email?: string
  phone?: string
}

interface StockTransaction {
  id: number
  inventoryItemId: number
  type: "in" | "out"
  quantity: number
  price?: number
  supplierId?: number
  note?: string
  date: string // Added date property
  // Optionally, you may have other properties like date, inventoryItem, supplier, etc.
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showAddItem, setShowAddItem] = useState(false)
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showStockTransaction, setShowStockTransaction] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  type ReportData = {
    summary?: InventoryItem[]
    consumption?: {
      date: string
      inventoryItem?: { name?: string; unit?: string }
      quantity: number
    }[]
    wastages?: {
      date: string
      inventoryItem?: { name?: string; unit?: string }
      quantity: number
      reason: string
      note?: string
    }[]
    purchases?: {
      date: string
      inventoryItem?: { name?: string; unit?: string }
      quantity: number
      price?: number
      supplier?: { name?: string }
      note?: string
    }[]
    usage?: {
      name: string
      unit: string
      totalUsed: number
    }[]
  } | null

  const [reportData, setReportData] = useState<ReportData>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  // Form states
  const [itemForm, setItemForm] = useState({
    name: "",
    category: "",
    unit: "",
    sku: "",
    quantity: 0,
    reorderLevel: 0,
    maxCapacity: 0,
    supplierId: "",
  })

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contact: "",
    email: "",
    phone: "",
  })

  const [stockForm, setStockForm] = useState<StockTransaction>({
    id: 0,
    inventoryItemId: 0,
    type: "in",
    quantity: 0,
    price: 0,
    supplierId: 0,
    note: "",
    date: new Date().toISOString(), // Default to current date
  })

  useEffect(() => {
    fetchInventory()
    fetchSuppliers()
    fetchTransactions()
  }, [])

  // Lookup SKU and autofill name/unit/category when adding an item
  async function handleSkuBlur() {
    const sku = itemForm.sku?.trim()
    if (!sku) return
    try {
      const res = await fetch(`/api/v1/inventory?type=itemBySku&sku=${encodeURIComponent(sku)}`)
      if (!res.ok) return
      const data = await res.json()
      const existing = data.item
      if (existing) {
        // Only autofill name, unit and category per request
        setItemForm((prev) => ({
          ...prev,
          name: existing.name || prev.name,
          unit: existing.unit || prev.unit,
          category: existing.category || prev.category,
        }))
      }
    } catch {
      // silent fail — keep UI responsive
    }
  }

  async function fetchInventory() {
    try {
      setLoading(true)
      const res = await fetch("/api/v1/inventory")

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      setItems(data.items || [])
      setError(null) // Clear any previous errors
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch inventory items"
      setError(errorMessage)
      console.error("Failed to fetch inventory items:", err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSuppliers() {
    try {
      const res = await fetch("/api/v1/inventory?type=suppliers")

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      setSuppliers(data.suppliers || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch suppliers"
      setError(errorMessage)
      console.error("Failed to fetch suppliers:", err)
    }
  }

  async function fetchTransactions() {
    try {
      setTransactionsLoading(true)
      const res = await fetch("/api/v1/inventory?type=transactions")
      if (!res.ok) throw new Error("Failed to fetch transactions")
      const data = await res.json()
      setTransactions(data.transactions || [])
    } catch  {
      // Optionally handle error
    } finally {
      setTransactionsLoading(false)
    }
  }

  async function fetchReport(type: string) {
    setReportLoading(true)
    setReportError(null)
    setReportData(null)
    try {
      const res = await fetch(`/api/v1/inventory/reports?type=${type}`)
      if (!res.ok) throw new Error("Failed to fetch report")
      const data = await res.json()
      setReportData(data)
    } catch  {
      setReportError("Failed to fetch report")
    } finally {
      setReportLoading(false)
    }
  }

  function handleReportSelect(type: string) {
    setSelectedReport(type)
    fetchReport(type)
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    try {
      setLoading(true)
      const res = await fetch("/api/v1/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addItem",
          ...itemForm,
          supplierId: itemForm.supplierId ? Number.parseInt(itemForm.supplierId) : null,
        }),
      })
      if (res.ok) {
        fetchInventory()
        setShowAddItem(false)
        setItemForm({
          name: "",
          category: "",
          unit: "",
          sku: "",
          quantity: 0,
          reorderLevel: 0,
          maxCapacity: 0,
          supplierId: "",
        })
      } else {
        setError("Failed to add item")
      }
    } catch  {
      setError("Failed to add item")
    } finally {
      setLoading(false)
    }
  }

  async function handleEditItem(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedItem) return

    try {
      setLoading(true)
      const res = await fetch("/api/v1/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "editItem",
          id: selectedItem.id,
          ...itemForm,
          supplierId: itemForm.supplierId ? Number.parseInt(itemForm.supplierId) : null,
        }),
      })
      if (res.ok) {
        fetchInventory()
        setSelectedItem(null)
        setItemForm({
          name: "",
          category: "",
          unit: "",
          sku: "",
          quantity: 0,
          reorderLevel: 0,
          maxCapacity: 0,
          supplierId: "",
        })
      } else {
        setError("Failed to update item")
      }
    } catch {
      setError("Failed to update item")
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteItem(id: number) {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      setLoading(true)
      const res = await fetch("/api/v1/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteItem", id }),
      })
      if (res.ok) {
        fetchInventory()
      } else {
        setError("Failed to delete item")
      }
    } catch {
      setError("Failed to delete item")
    } finally {
      setLoading(false)
    }
  }

  async function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault()
    try {
      setLoading(true)
      const res = await fetch("/api/v1/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addSupplier", ...supplierForm }),
      })
      if (res.ok) {
        fetchSuppliers()
        setShowAddSupplier(false)
        setSupplierForm({ name: "", contact: "", email: "", phone: "" })
      } else {
        setError("Failed to add supplier")
      }
    } catch {
      setError("Failed to add supplier")
    } finally {
      setLoading(false)
    }
  }

  async function handleEditSupplier(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSupplier) return

    try {
      setLoading(true)
      const res = await fetch("/api/v1/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "editSupplier",
          id: selectedSupplier.id,
          ...supplierForm,
        }),
      })
      if (res.ok) {
        fetchSuppliers()
        setSelectedSupplier(null)
        setSupplierForm({ name: "", contact: "", email: "", phone: "" })
      } else {
        setError("Failed to update supplier")
      }
    } catch {
      setError("Failed to update supplier")
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteSupplier(id: number) {
    if (!confirm("Are you sure you want to delete this supplier?")) return

    try {
      setLoading(true)
      const res = await fetch("/api/v1/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteSupplier", id }),
      })
      if (res.ok) {
        fetchSuppliers()
      } else {
        setError("Failed to delete supplier")
      }
    } catch {
      setError("Failed to delete supplier")
    } finally {
      setLoading(false)
    }
  }

  async function handleStockTransaction(e: React.FormEvent) {
    e.preventDefault()
    try {
      setLoading(true)
      const res = await fetch("/api/v1/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "stockInOut",
          ...stockForm,
          supplierId: stockForm.supplierId || null,
        }),
      })
      if (res.ok) {
        fetchInventory()
        fetchTransactions()
        setShowStockTransaction(false)
        setStockForm({
          id: 0,
          inventoryItemId: 0,
          type: "in",
          quantity: 0,
          price: 0,
          supplierId: 0,
          note: "",
          date: new Date().toISOString(), // Reset to current date
        })
        setError(null)
      } else {
        const data = await res.json()
        setError(data?.error || "Failed to process stock transaction")
      }
    } catch {
      setError("Failed to process stock transaction")
    } finally {
      setLoading(false)
    }
  }

  function openEditItem(item: InventoryItem) {
    setSelectedItem(item)
    setItemForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      sku: item.sku,
      quantity: item.quantity,
      reorderLevel: item.reorderLevel,
      maxCapacity: item.maxCapacity,
      supplierId: item.supplierId?.toString() || "",
    })
  }

  function openEditSupplier(supplier: Supplier) {
    setSelectedSupplier(supplier)
    setSupplierForm({
      name: supplier.name,
      contact: supplier.contact,
      email: supplier.email || "",
      phone: supplier.phone || "",
    })
  }

  const lowStockItems = items.filter((item) => item.quantity <= item.reorderLevel)

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="text-amber-500" /> Inventory Management
        </h1>
        <Button onClick={() => setShowAddItem(true)} className="bg-amber-500 hover:bg-amber-600">
          <Plus size={16} className="mr-2" /> Add Item
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
            <X size={16} />
          </Button>
        </Alert>
      )}

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Low stock alert for:</strong> {lowStockItems.map((i) => i.name).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={18} /> Stock Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Reorder</TableHead>
                <TableHead>Max</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-400 py-6">
                    No inventory items yet.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className={item.quantity <= item.reorderLevel ? "bg-red-50" : ""}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.reorderLevel}</TableCell>
                    <TableCell>{item.maxCapacity}</TableCell>
                    <TableCell>{item.supplier?.name || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditItem(item)}>
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-500"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stock In/Out Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck size={18} /> Stock In / Out
            </div>
            <Button onClick={() => setShowStockTransaction(true)} variant="outline">
              <Plus size={16} className="mr-2" /> New Transaction
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">Manage stock transactions, purchases, and consumption here.</p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">Loading...</TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-400 py-6">
                      No stock transactions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>{new Date(txn.date).toLocaleString()}</TableCell>
                      <TableCell>
                        {items.find((item) => item.id === txn.inventoryItemId)?.name || "-"}
                      </TableCell>
                      <TableCell>
                        <span className={txn.type === "in" ? "text-green-600" : "text-red-600"}>
                          {txn.type === "in" ? "Stock In" : "Stock Out"}
                        </span>
                      </TableCell>
                      <TableCell>{txn.quantity}</TableCell>
                      <TableCell>
                        {suppliers.find((s) => s.id === txn.supplierId)?.name || "-"}
                      </TableCell>
                      <TableCell>{txn.price ? `₹${txn.price}` : "-"}</TableCell>
                      <TableCell>{txn.note || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users size={18} /> Suppliers
            </div>
            <Button onClick={() => setShowAddSupplier(true)} className="bg-amber-500 hover:bg-amber-600">
              <Plus size={14} className="mr-2" /> Add Supplier
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-6">
                    No suppliers yet.
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>{supplier.name}</TableCell>
                    <TableCell>{supplier.contact}</TableCell>
                    <TableCell>{supplier.email || "-"}</TableCell>
                    <TableCell>{supplier.phone || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditSupplier(supplier)}>
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        className="text-red-500"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 size={18} /> Inventory Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedReport === "summary" ? "default" : "outline"}
              onClick={() => handleReportSelect("summary")}
            >
              Stock Summary
            </Button>
            <Button
              variant={selectedReport === "consumption" ? "default" : "outline"}
              onClick={() => handleReportSelect("consumption")}
            >
              Stock Consumption
            </Button>
            <Button
              variant={selectedReport === "wastage" ? "default" : "outline"}
              onClick={() => handleReportSelect("wastage")}
            >
              Wastage
            </Button>
            <Button
              variant={selectedReport === "purchase" ? "default" : "outline"}
              onClick={() => handleReportSelect("purchase")}
            >
              Purchase History
            </Button>
            <Button
              variant={selectedReport === "ingredient-usage" ? "default" : "outline"}
              onClick={() => handleReportSelect("ingredient-usage")}
            >
              Ingredient Usage
            </Button>
          </div>
          {!selectedReport && (
            <>
              <ul className="list-disc ml-6 text-gray-700 space-y-1">
                <li>Stock Summary Report</li>
                <li>Daily/Monthly Stock Consumption</li>
                <li>Wastage Report</li>
                <li>Purchase History Report</li>
                <li>Ingredient-wise Usage Report</li>
              </ul>
              <p className="text-gray-400 mt-2">Select a report to view details.</p>
            </>
          )}
          {reportLoading && <div className="text-gray-500 py-4">Loading report...</div>}
          {reportError && <div className="text-red-500 py-4">{reportError}</div>}
          {/* Render report tables */}
          {selectedReport === "summary" && reportData?.summary && (
            <div className="overflow-x-auto mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead>Max Capacity</TableHead>
                    <TableHead>Supplier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.summary.map((item: InventoryItem) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.reorderLevel}</TableCell>
                      <TableCell>{item.maxCapacity}</TableCell>
                      <TableCell>{item.supplier?.name || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {selectedReport === "consumption" && reportData?.consumption && (
            <div className="overflow-x-auto mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.consumption.map((row: {
                    date: string;
                    inventoryItem?: { name?: string; unit?: string };
                    quantity: number;
                  }, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>{new Date(row.date).toLocaleString()}</TableCell>
                      <TableCell>{row.inventoryItem?.name || "-"}</TableCell>
                      <TableCell>{row.inventoryItem?.unit || "-"}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {selectedReport === "wastage" && reportData?.wastages && (
            <div className="overflow-x-auto mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.wastages.map(
                    (
                      row: {
                        date: string;
                        inventoryItem?: { name?: string; unit?: string };
                        quantity: number;
                        reason: string;
                        note?: string;
                      },
                      idx: number
                    ) => (
                      <TableRow key={idx}>
                        <TableCell>{new Date(row.date).toLocaleString()}</TableCell>
                        <TableCell>{row.inventoryItem?.name || "-"}</TableCell>
                        <TableCell>{row.inventoryItem?.unit || "-"}</TableCell>
                        <TableCell>{row.quantity}</TableCell>
                        <TableCell>{row.reason}</TableCell>
                        <TableCell>{row.note || "-"}</TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          {selectedReport === "purchase" && reportData?.purchases && (
            <div className="overflow-x-auto mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.purchases.map(
                    (
                      row: {
                        date: string;
                        inventoryItem?: { name?: string; unit?: string };
                        quantity: number;
                        price?: number;
                        supplier?: { name?: string };
                        note?: string;
                      },
                      idx: number
                    ) => (
                      <TableRow key={idx}>
                        <TableCell>{new Date(row.date).toLocaleString()}</TableCell>
                        <TableCell>{row.inventoryItem?.name || "-"}</TableCell>
                        <TableCell>{row.inventoryItem?.unit || "-"}</TableCell>
                        <TableCell>{row.quantity}</TableCell>
                        <TableCell>{row.price ? `₹${row.price}` : "-"}</TableCell>
                        <TableCell>{row.supplier?.name || "-"}</TableCell>
                        <TableCell>{row.note || "-"}</TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          {selectedReport === "ingredient-usage" && reportData?.usage && (
            <div className="overflow-x-auto mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Total Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.usage.map(
                    (
                      row: { name: string; unit: string; totalUsed: number },
                      idx: number
                    ) => (
                      <TableRow key={idx}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.unit}</TableCell>
                        <TableCell>{row.totalUsed}</TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Item Modal */}
      <Dialog
        open={showAddItem || selectedItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddItem(false)
            setSelectedItem(null)
            setItemForm({
              name: "",
              category: "",
              unit: "",
              sku: "",
              quantity: 0,
              reorderLevel: 0,
              maxCapacity: 0,
              supplierId: "",
            })
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedItem ? "Edit Item" : "Add New Item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={selectedItem ? handleEditItem : handleAddItem} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={itemForm.category}
                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={itemForm.unit}
                  onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                  placeholder="kg, liter, piece"
                  required
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={itemForm.sku}
                  onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                  onBlur={handleSkuBlur}
                  placeholder="Enter SKU and tab out to autofill if existing"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: Number.parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="reorderLevel">Reorder Level</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  value={itemForm.reorderLevel}
                  onChange={(e) => setItemForm({ ...itemForm, reorderLevel: Number.parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxCapacity">Max Capacity</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  value={itemForm.maxCapacity}
                  onChange={(e) => setItemForm({ ...itemForm, maxCapacity: Number.parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Select
                value={itemForm.supplierId}
                onValueChange={(value) => setItemForm({ ...itemForm, supplierId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddItem(false)
                  setSelectedItem(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : selectedItem ? "Update" : "Add"} Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Supplier Modal */}
      <Dialog
        open={showAddSupplier || selectedSupplier !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddSupplier(false)
            setSelectedSupplier(null)
            setSupplierForm({ name: "", contact: "", email: "", phone: "" })
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedSupplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={selectedSupplier ? handleEditSupplier : handleAddSupplier} className="space-y-4">
            <div>
              <Label htmlFor="supplierName">Name</Label>
              <Input
                id="supplierName"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="contact">Contact Person</Label>
              <Input
                id="contact"
                value={supplierForm.contact}
                onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddSupplier(false)
                  setSelectedSupplier(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : selectedSupplier ? "Update" : "Add"} Supplier
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Transaction Modal */}
      <Dialog open={showStockTransaction} onOpenChange={setShowStockTransaction}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Stock Transaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStockTransaction} className="space-y-4">
            <div>
              <Label htmlFor="item">Item</Label>
              <Select
                value={stockForm.inventoryItemId.toString()}
                onValueChange={(value) => setStockForm({ ...stockForm, inventoryItemId: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name} (Current: {item.quantity} {item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Transaction Type</Label>
              <Select
                value={stockForm.type}
                onValueChange={(value: "in" | "out") => setStockForm({ ...stockForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stock In</SelectItem>
                  <SelectItem value="out">Stock Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transactionQuantity">Quantity</Label>
                <Input
                  id="transactionQuantity"
                  type="number"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({ ...stockForm, quantity: Number.parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Price (optional)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={stockForm.price}
                  onChange={(e) => setStockForm({ ...stockForm, price: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            {stockForm.type === "in" && (
              <div>
                <Label htmlFor="transactionSupplier">Supplier</Label>
                <Select
                  value={stockForm.supplierId?.toString() || ""}
                  onValueChange={(value) =>
                    setStockForm({ ...stockForm, supplierId: Number.parseInt(value) || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="note">Note</Label>
              <Input
                id="note"
                value={stockForm.note}
                onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })}
                placeholder="Optional note"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowStockTransaction(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Processing..." : "Process Transaction"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
