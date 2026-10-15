"use client";

import Link from "next/link";
import { PackageOpen, ArrowRight } from "lucide-react";

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = "No Products Found",
  description = "We couldn't find any items matching your selected criteria. Try adjusting your filters or search keywords.",
  actionLabel = "Browse All Products",
  actionHref = "/products"
}) {
  return (
    <div className="py-16 px-4 text-center max-w-md mx-auto flex flex-col items-center">
      <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-500 mb-4 shadow-xs">
        <Icon className="w-8 h-8 text-stone-400" />
      </div>
      <h3 className="text-lg font-serif font-bold text-stone-900">{title}</h3>
      <p className="text-xs sm:text-sm text-stone-500 mt-2 leading-relaxed">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-md transition-all group"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}
