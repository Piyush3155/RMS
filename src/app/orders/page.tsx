//importing menu component 

"use client";
import Menu from "@/components/menu/page";
import { Suspense } from "react";

  export default function OrdersPage() {
    return (
      <div className="p-0 m-0 ">
              <Suspense fallback={<div>Loading...</div>}>
        <Menu />
      </Suspense>
      </div>
    );
  }

