"use client";

import { useEffect, useState } from "react";
import { productService } from "@/services/productService";
import { Globe2 } from "lucide-react";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    productService.getAdminProducts()
      .then((products) => {
        if (active) {
          const counts = new Map();
          for (const product of products) if (product.brand) counts.set(product.brand, (counts.get(product.brand) || 0) + 1);
          setBrands([...counts.entries()].sort(([a], [b]) => a.localeCompare(b)));
        }
      })
      .catch((loadError) => { if (active) setError(loadError.message || "Could not load brands."); });
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="pb-4 border-b border-stone-200">
        <h1 className="text-2xl font-serif font-bold text-stone-950">
          Imported Brands Directory
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          International manufacturers and official brand distributors represented in the catalog.
        </p>
      </div>

      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {brands.map(([brandName, count]) => {
          return (
            <div
              key={brandName}
              className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-sm">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-stone-900 text-xs sm:text-sm">{brandName}</h4>
                  <span className="text-[11px] text-stone-400">Authentic Import</span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded font-mono text-xs font-bold">
                {count} SKUs
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
