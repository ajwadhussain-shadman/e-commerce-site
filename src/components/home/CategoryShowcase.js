"use client";

import Link from "next/link";
import Image from "next/image";
import { categories } from "@/data/categories";
import { ArrowRight } from "lucide-react";

export default function CategoryShowcase() {
  return (
    <section className="py-12 bg-surface border-b border-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-amber-800">
              Explore Collections
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mt-1">
              Shop by Imported Category
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs sm:text-sm font-semibold text-amber-900 hover:text-amber-700 flex items-center gap-1 group"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Circular / Card Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group flex flex-col items-center text-center p-3 rounded-2xl bg-surface-muted/60 hover:bg-surface-muted/90 border border-border/60 hover:border-amber-700/30 transition-all duration-300"
            >
              {/* Circular Avatar */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-3 bg-surface-warm shadow-sm border-2 border-white group-hover:scale-105 group-hover:border-amber-500/50 transition-all duration-300">
                {typeof cat.image === "string" && cat.image.trim() && (cat.image.trim().startsWith("/") || /^https?:\/\//i.test(cat.image.trim())) ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : null}
              </div>

              {/* Title & Item count */}
              <h3 className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-amber-900 transition-colors line-clamp-2 leading-tight">
                {cat.name}
              </h3>
              <span className="text-[11px] text-muted-foreground mt-1 font-medium">
                {cat.itemCount} items
              </span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
