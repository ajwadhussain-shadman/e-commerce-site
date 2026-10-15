"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  PlusCircle, 
  Tags, 
  Globe2, 
  ShoppingBag, 
  Users, 
  TicketPercent, 
  Image as ImageIcon, 
  Settings, 
  ArrowLeft,
  X
} from "lucide-react";

export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  const links = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "All Products", href: "/admin/products", icon: Package },
    { label: "Add New Product", href: "/admin/products/new", icon: PlusCircle },
    { label: "Categories", href: "/admin/categories", icon: Tags },
    { label: "Imported Brands", href: "/admin/brands", icon: Globe2 },
    { label: "Orders & Shipping", href: "/admin/orders", icon: ShoppingBag },
    { label: "Customer Accounts", href: "/admin/customers", icon: Users },
    { label: "Discount Coupons", href: "/admin/coupons", icon: TicketPercent },
    { label: "Hero Banners", href: "/admin/banners", icon: ImageIcon },
    { label: "Store Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-stone-950 text-stone-200 border-r border-stone-800 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 font-serif font-bold text-lg flex items-center justify-center">
              N
            </div>
            <div>
              <span className="font-serif font-bold tracking-wider text-sm text-white">NOVELLA</span>
              <span className="block text-[10px] text-amber-400 uppercase tracking-widest font-mono">
                Admin Control
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 px-3 py-1 mb-1">
            Store Operations
          </div>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-amber-600 text-stone-950 font-bold shadow-xs"
                    : "text-stone-400 hover:text-white hover:bg-stone-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-stone-950" : "text-stone-400"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer link to storefront */}
        <div className="p-4 border-t border-stone-800 bg-stone-900/50">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-stone-300 hover:text-amber-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Storefront
          </Link>
        </div>
      </aside>
    </>
  );
}
