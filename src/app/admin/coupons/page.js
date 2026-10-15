"use client";

import { TicketPercent, Plus, Check } from "lucide-react";

export default function AdminCouponsPage() {
  const coupons = [
    {
      code: "IMPORT10",
      description: "10% off on all imported goods catalog",
      discount: "10% Percentage",
      minSpend: "৳0 (Any order)",
      usageCount: 142,
      status: "Active"
    },
    {
      code: "WELCOME500",
      description: "৳500 flat discount for first-time orders",
      discount: "৳500 Flat",
      minSpend: "৳2,000",
      usageCount: 89,
      status: "Active"
    },
    {
      code: "FREESHIP",
      description: "Free nationwide shipping coupon",
      discount: "100% Free Shipping",
      minSpend: "৳0",
      usageCount: 64,
      status: "Active"
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-950">
            Promotional Coupons & Vouchers
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage storefront discount codes and promotional campaigns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {coupons.map((c, i) => (
          <div
            key={i}
            className="p-6 bg-white rounded-3xl border border-stone-200/90 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg font-mono font-bold text-sm tracking-wider">
                  {c.code}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                  {c.status}
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-2">{c.description}</p>
            </div>

            <div className="space-y-1.5 text-xs text-stone-500 pt-3 border-t border-stone-100">
              <div className="flex justify-between">
                <span>Benefit:</span>
                <span className="font-semibold text-stone-900">{c.discount}</span>
              </div>
              <div className="flex justify-between">
                <span>Min Order:</span>
                <span className="font-semibold text-stone-900">{c.minSpend}</span>
              </div>
              <div className="flex justify-between">
                <span>Redemptions:</span>
                <span className="font-semibold text-stone-900 font-mono">{c.usageCount} times</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
