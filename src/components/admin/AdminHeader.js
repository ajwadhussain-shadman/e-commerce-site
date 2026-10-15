"use client";

import Link from "next/link";
import { Menu, Bell, ExternalLink, ShieldCheck } from "lucide-react";

export default function AdminHeader({ onOpenSidebar }) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-stone-200 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-stone-700 hover:text-stone-900 rounded-lg hover:bg-stone-100"
          aria-label="Open Admin Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <span className="text-xs font-bold text-stone-900 hidden sm:inline">
            Importora Management Console
          </span>
          <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono font-bold sm:ml-2">
            Local Demo State Active
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-lg transition-colors"
        >
          <span>View Live Store</span>
          <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
        </Link>

        <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
          <div className="w-7 h-7 rounded-full bg-stone-900 text-amber-400 font-serif font-bold text-xs flex items-center justify-center">
            A
          </div>
          <span className="font-semibold text-stone-900 hidden sm:inline">Demo Admin</span>
        </div>
      </div>
    </header>
  );
}
