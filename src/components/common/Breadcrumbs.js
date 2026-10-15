"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="py-3 text-xs text-stone-500">
      <ol className="flex items-center flex-wrap gap-1.5">
        <li className="flex items-center">
          <Link href="/" className="hover:text-stone-900 transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3 text-stone-400 shrink-0" />
              {isLast || !item.href ? (
                <span className="font-semibold text-stone-900 truncate max-w-[200px] sm:max-w-md">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-stone-900 transition-colors truncate max-w-[160px]">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
