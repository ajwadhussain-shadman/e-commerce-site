"use client";

import { Truck, RotateCcw, ShieldCheck, Headphones } from "lucide-react";

export default function TrustBadges() {
  const perks = [
    {
      icon: Truck,
      title: "Nationwide Delivery",
      desc: "Fast delivery inside Dhaka (24-48h) and express delivery to all 64 districts in Bangladesh.",
      color: "text-amber-800 bg-amber-50"
    },
    {
      icon: ShieldCheck,
      title: "100% Genuine Imported",
      desc: "Authentic global products imported directly from Japan, the UK, Europe, Korea, and the US.",
      color: "text-emerald-800 bg-emerald-50"
    },
    {
      icon: RotateCcw,
      title: "7-Day Return Policy",
      desc: "Hassle-free demo exchange policy if an item arrives damaged or compromised during transit.",
      color: "text-blue-800 bg-blue-50"
    },
    {
      icon: Headphones,
      title: "Dedicated Support",
      desc: "Friendly customer assistance via hotline and WhatsApp from 10:00 AM to 10:00 PM daily.",
      color: "text-purple-800 bg-purple-50"
    }
  ];

  return (
    <section className="py-12 bg-white border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {perks.map((perk, i) => {
            const Icon = perk.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-4 p-5 rounded-2xl bg-stone-50/70 border border-stone-200/60 hover:border-amber-700/20 transition-all duration-300"
              >
                <div className={`p-3 rounded-xl ${perk.color} shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">{perk.title}</h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">{perk.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
