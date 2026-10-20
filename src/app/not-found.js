import Link from "next/link";
import { ArrowRight, PackageX, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mb-6 shadow-sm">
        <PackageX className="w-10 h-10" />
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-amber-800 bg-amber-100/60 px-3 py-1 rounded-full mb-3">
        404 • Page Not Found
      </span>

      <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-950 max-w-md">
        This Imported Item or Page Could Not Be Found
      </h1>

      <p className="text-xs sm:text-sm text-stone-600 max-w-md mt-3 leading-relaxed">
        The link you followed may be outdated, or the product may have been relocated. Explore our current catalog of authentic imported goods.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          <Home className="w-4 h-4" /> Back to Storefront
        </Link>
        <Link
          href="/products"
          className="px-6 py-3 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-full text-xs font-semibold flex items-center gap-2 shadow-xs transition-all"
        >
          <Search className="w-4 h-4" /> Browse Catalog
        </Link>
      </div>
    </div>
  );
}
