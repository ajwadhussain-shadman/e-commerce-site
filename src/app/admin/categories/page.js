"use client";

import Image from "next/image";
import Link from "next/link";
import { categories } from "@/data/categories";
import { Tags, ExternalLink, Plus } from "lucide-react";

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-950">
            Category Taxonomy & Subcategories
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage product collections, banners, and subcategories for the imported store.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white rounded-3xl border border-stone-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start gap-4">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-base text-stone-950 truncate">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-mono font-bold">
                    {cat.itemCount} SKUs
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                  {cat.description}
                </p>
              </div>
            </div>

            {/* Subcategories list */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                Subcategories ({cat.subcategories.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {cat.subcategories.map((sub, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-stone-50 border border-stone-200 text-stone-700 text-xs rounded-lg font-medium"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-400 font-mono">slug: /categories/{cat.slug}</span>
              <Link
                href={`/categories/${cat.slug}`}
                target="_blank"
                className="text-amber-900 font-bold hover:underline flex items-center gap-1"
              >
                View Category <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
