"use client";

import { brands, products } from "@/data/products";
import { Globe2 } from "lucide-react";

export default function AdminBrandsPage() {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {brands.map((brandName, idx) => {
          const count = products.filter(p => p.brand === brandName).length;
          return (
            <div
              key={idx}
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
