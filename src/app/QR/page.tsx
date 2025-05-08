"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

const tables = Array.from({ length: 9 }, (_, i) => i + 1);

export default function QRCodeGenerator() {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {tables.map((tableNo) => (
        <div key={tableNo} className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold text-center">Table {tableNo}</h3>
          {origin && (
            <QRCodeCanvas value={`http://192.168.29.167:3000/orders?table=${tableNo}`} size={150} />
            
          )}
        </div>
      ))}
      
    </div>
  );
}
