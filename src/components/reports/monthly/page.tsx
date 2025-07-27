"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import "jspdf-autotable"

type OrderAnalytics = {
  id: number
  orderId: number
  totalAmount: number
  totalItemsSold: number
  topItemName: string
  topItemCount: number
  createdAt: string
}

export default function MonthlyReports() {
  const [data, setData] = useState<OrderAnalytics[]>([])

  useEffect(() => {
    fetch("/api/v1/reports/monthly")
      .then((res) => res.json())
      .then((res) => setData(res))
  }, [])

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.map(({ topItemName, totalAmount, totalItemsSold, topItemCount, createdAt }) => ({
        "Item Name": topItemName,
        "Total Amount": totalAmount,
        "Items Sold": totalItemsSold,
        "Top Item Count": topItemCount,
        Date: new Date(createdAt).toLocaleDateString(),
      }))
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Report")
    XLSX.writeFile(workbook, "MonthlySalesReport.xlsx")
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.text("Monthly Sales Report", 14, 15)
    const tableData = data.map((item) => [
      item.topItemName,
      item.totalAmount.toFixed(2),
      item.totalItemsSold,
      item.topItemCount,
      new Date(item.createdAt).toLocaleDateString(),
    ])
    doc.autoTable({
      head: [["Item Name", "Total Amount", "Items Sold", "Top Item Count", "Date"]],
      body: tableData,
      startY: 20,
    })
    doc.save("MonthlySalesReport.pdf")
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Monthly Sales Report</h2>
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 flex items-center gap-2"
          >
            <Download size={16} /> Excel
          </button>
          <button
            onClick={exportToPDF}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 flex items-center gap-2"
          >
            <Download size={16} /> PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 font-semibold text-gray-600">
            <tr>
              <th className="px-4 py-2">Item Name</th>
              <th className="px-4 py-2">Total Amount</th>
              <th className="px-4 py-2">Items Sold</th>
              <th className="px-4 py-2">Top Item Count</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-2">{item.topItemName}</td>
                <td className="px-4 py-2">₹{item.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-2">{item.totalItemsSold}</td>
                <td className="px-4 py-2">{item.topItemCount}</td>
                <td className="px-4 py-2">
                  {new Date(item.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
