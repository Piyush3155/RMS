'use client';

import { BarChart, Coffee, DollarSign, TrendingUp } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface SalesData {
  totalSales?: number;
  totalItemsSold?: number;
  mostSoldItem?: {
    itemName?: string;
    quantity?: number;
  };
}

const Page = () => {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const res = await fetch('/api/v1/sales');
        if (!res.ok) throw new Error('Failed to fetch data');
        const result = await res.json();
        console.log(result);
        setData(result);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  if (loading) return <p>Loading sales data...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!data) return <p>No data available</p>;

  const totalSales = typeof data.totalSales === 'number' ? data.totalSales : 0;
  const totalItemsSold = typeof data.totalItemsSold === 'number' ? data.totalItemsSold : 0;
  const itemName = data.mostSoldItem?.itemName || 'N/A';
  const itemQty = typeof data.mostSoldItem?.quantity === 'number' ? data.mostSoldItem.quantity : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BarChart className="text-blue-600" size={24} />
          Sales Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-700">Total Sales</h3>
              <DollarSign className="text-blue-600" size={20} />
            </div>
            <p className="text-2xl font-bold text-blue-700 mt-2">
              ₹{totalSales.toFixed(2)}
            </p>
          </div>

          <div className="bg-green-50 p-6 rounded-xl border border-green-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-700">Items Sold</h3>
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <p className="text-2xl font-bold text-green-700 mt-2">
              {totalItemsSold}
            </p>
          </div>

          <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-700">Most Sold Item</h3>
              <Coffee className="text-yellow-600" size={20} />
            </div>
            <p className="text-lg font-semibold text-yellow-700 mt-2">
              {itemName}
            </p>
            <p className="text-sm text-gray-600">
              Qty: {itemQty}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
