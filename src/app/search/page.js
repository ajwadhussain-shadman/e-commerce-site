"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/common/SiteHeader";
import CategoryNavigation from "@/components/common/CategoryNavigation";
import MobileNavigation from "@/components/common/MobileNavigation";
import SiteFooter from "@/components/common/SiteFooter";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ProductCard from "@/components/products/ProductCard";
import EmptyState from "@/components/common/EmptyState";
import { productService } from "@/services/productService";
import { Search as SearchIcon, Sparkles } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    const request = query.trim() ? productService.getAllProducts({ search: query }) : Promise.resolve([]);
    request
      .then((items) => { if (active) { setProducts(items); setLoadError(""); } })
      .catch((error) => { if (active) { setProducts([]); setLoadError(error.message || "Could not load search results."); } });
    return () => { active = false; };
  }, [query]);

  const popularSearches = ["KitKat", "Buldak Ramen", "Horlicks", "Oats", "Olaplex", "Sneakers", "Lindt"];

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    let matches = products.filter((product) => [product.name, product.brand, product.category, product.subcategory, product.shortDescription].some((value) => String(value || "").toLowerCase().includes(q)));

    switch (sortBy) {
      case "price-low":
        matches.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
        break;
      case "price-high":
        matches.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
        break;
      case "rating":
        matches.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "relevance":
      default:
        // Already matches
        break;
    }
    return matches;
  }, [query, sortBy, products]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
      <CategoryNavigation />
      <MobileNavigation isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <Breadcrumbs items={[{ label: "Search Results", href: "/search" }, { label: query || "All" }]} />

        {/* Search header */}
        <div className="py-6 border-b border-border flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-amber-800 flex items-center gap-1.5">
              <SearchIcon className="w-3.5 h-3.5" /> Product Search
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mt-1">
              Search Results for: &ldquo;<span className="text-amber-900">{query}</span>&rdquo;
            </h1>
            <p className="text-xs text-muted-foreground mt-1" role={loadError ? "alert" : undefined}>
              {loadError || `Found ${searchResults.length} matching imported items`}
            </p>
          </div>

          {searchResults.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="searchSort" className="text-xs text-muted-foreground">Sort:</label>
              <select
                id="searchSort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-surface text-foreground text-xs font-semibold rounded-xl border border-border shadow-xs focus:outline-hidden"
              >
                <option value="relevance">Most Relevant</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          )}
        </div>

        {/* Popular search pills */}
        <div className="py-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground font-medium">Popular searches:</span>
          {popularSearches.map((term, i) => (
            <Link
              key={i}
              href={`/search?q=${encodeURIComponent(term)}`}
              className="px-3 py-1 bg-surface-muted hover:bg-surface-warm text-foreground rounded-full font-medium transition-colors"
            >
              {term}
            </Link>
          ))}
        </div>

        {/* Results grid or empty state */}
        <div className="py-6">
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {searchResults.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={`No results found for "${query}"`}
              description="Check your spelling or try searching for generic terms like 'KitKat', 'ramen', 'oats', 'Horlicks', or 'shampoo'."
              actionLabel="Explore All Products"
              actionHref="/products"
            />
          )}
        </div>

      </main>

      <SiteFooter />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background p-12 text-center text-sm text-muted-foreground">Searching imported catalog...</div>}>
      <SearchContent />
    </Suspense>
  );
}
