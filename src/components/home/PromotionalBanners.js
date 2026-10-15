"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

export default function PromotionalBanners() {
  return (
    <section className="py-12 bg-[#faf9f6] border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Japanese & Chinese Food Craze */}
          <div className="relative rounded-3xl overflow-hidden bg-stone-900 text-white min-h-[260px] flex flex-col justify-end p-6 group shadow-md">
            <Image
              src="https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80"
              alt="Japanese & Korean Asian Ramen"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover opacity-50 group-hover:scale-105 group-hover:opacity-40 transition-all duration-500"
            />
            <div className="relative z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-full inline-block mb-2">
                Korean & Japanese Craze
              </span>
              <h3 className="text-xl font-serif font-bold text-white leading-tight">
                Spicy Buldak & Tonkotsu Ramen
              </h3>
              <p className="text-xs text-stone-300 mt-1 line-clamp-2">
                Directly imported Samyang fire noodles, Nissin Raoh, and savory Sichuan chili crisp oils.
              </p>
              <Link
                href="/categories/noodles-asian-foods"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-amber-300 transition-colors"
              >
                <span>Shop Asian Foods</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2: British Morning Vitality */}
          <div className="relative rounded-3xl overflow-hidden bg-stone-900 text-white min-h-[260px] flex flex-col justify-end p-6 group shadow-md">
            <Image
              src="https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=800&q=80"
              alt="Horlicks & European Oats"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover opacity-50 group-hover:scale-105 group-hover:opacity-40 transition-all duration-500"
            />
            <div className="relative z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full inline-block mb-2">
                UK Healthy Mornings
              </span>
              <h3 className="text-xl font-serif font-bold text-white leading-tight">
                Horlicks UK & Quaker Rolled Oats
              </h3>
              <p className="text-xs text-stone-300 mt-1 line-clamp-2">
                Original malted nutrition formulas and 100% British wholegrain rolled oats for all ages.
              </p>
              <Link
                href="/categories/breakfast-cereals"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-emerald-300 transition-colors"
              >
                <span>Shop Breakfast & Nutrition</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 3: Imported Sneaker Footwear */}
          <div className="relative rounded-3xl overflow-hidden bg-stone-900 text-white min-h-[260px] flex flex-col justify-end p-6 group shadow-md md:col-span-2 lg:col-span-1">
            <Image
              src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80"
              alt="Imported Sneakers"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover opacity-50 group-hover:scale-105 group-hover:opacity-40 transition-all duration-500"
            />
            <div className="relative z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/20 px-2.5 py-1 rounded-full inline-block mb-2">
                Streetwear & Trainers
              </span>
              <h3 className="text-xl font-serif font-bold text-white leading-tight">
                Air Jordan 1 & Adidas Samba
              </h3>
              <p className="text-xs text-stone-300 mt-1 line-clamp-2">
                Authentic imported classic silhouettes and court trainers with verified quality.
              </p>
              <Link
                href="/categories/footwear-sneakers"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-rose-300 transition-colors"
              >
                <span>Shop Footwear</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
