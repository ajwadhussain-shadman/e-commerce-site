"use client";

import Image from "next/image";
import { Image as ImageIcon, ExternalLink, Plus } from "lucide-react";

export default function AdminBannersPage() {
  const banners = [
    {
      title: "Hero Banner - Global Pantry & Lifestyle",
      placement: "Homepage Top Carousel",
      headline: "Authentic Imported Delights & Lifestyle Delivered in Bangladesh",
      image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80",
      link: "/products",
      status: "Active"
    },
    {
      title: "Asian Food Craze - Buldak & Tonkotsu",
      placement: "Homepage Promo Grid",
      headline: "Spicy Buldak & Tonkotsu Ramen",
      image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80",
      link: "/categories/noodles-asian-foods",
      status: "Active"
    },
    {
      title: "European Oats & Horlicks Malts",
      placement: "Homepage Promo Grid",
      headline: "Horlicks UK & Quaker Rolled Oats",
      image: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=800&q=80",
      link: "/categories/breakfast-cereals",
      status: "Active"
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-stone-200">
        <h1 className="text-2xl font-serif font-bold text-stone-950">
          Promotional Banners & Creative Assets
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Configure visual hero campaigns and category highlight cards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {banners.map((b, i) => (
          <div
            key={i}
            className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs flex flex-col justify-between"
          >
            <div className="relative aspect-16/9 w-full bg-stone-100">
              <Image
                src={b.image}
                alt={b.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-stone-900/80 text-white backdrop-blur-xs">
                {b.status}
              </span>
            </div>

            <div className="p-4 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                {b.placement}
              </span>
              <h3 className="font-serif font-bold text-sm text-stone-900 leading-snug">
                {b.title}
              </h3>
              <p className="text-stone-500 line-clamp-1">{b.headline}</p>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-stone-400 font-mono text-[11px]">
                <span>Target: {b.link}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
