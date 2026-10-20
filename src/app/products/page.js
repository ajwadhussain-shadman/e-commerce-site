"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SiteHeader from "@/components/common/SiteHeader";
import CategoryNavigation from "@/components/common/CategoryNavigation";
import MobileNavigation from "@/components/common/MobileNavigation";
import SiteFooter from "@/components/common/SiteFooter";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ProductCard from "@/components/products/ProductCard";
import EmptyState from "@/components/common/EmptyState";
import { categoryService, productService } from "@/services/productService";
import { 
  SlidersHorizontal, 
  X, 
  RotateCcw, 
  ChevronDown, 
  Check, 
  Search,
  Filter
} from "lucide-react";

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [categories, setCategories] = useState([]);

  // Filters state initialized from searchParams
  const categoryParam = searchParams.get("category") || "";
  const subcategoryParam = searchParams.get("subcategory") || "";
  const brandParam = searchParams.get("brand") || "";
  const filterParam = searchParams.get("filter") || ""; // "deals", "new", "bestsellers"
  const searchParam = searchParams.get("search") || "";

  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategoryParam);
  const [selectedBrand, setSelectedBrand] = useState(brandParam);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [visibleCount, setVisibleCount] = useState(12);

  // Load products from service
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [data, categoryData] = await Promise.all([
          productService.getAllProducts(),
          categoryService.getCategories(),
        ]);
        if (active) {
          setAllProducts(data);
          setCategories(categoryData);
        }
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const brands = useMemo(() => [...new Set(allProducts.map((product) => product.brand).filter(Boolean))].sort(), [allProducts]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // URL filter shortcuts
    if (filterParam === "deals") {
      result = result.filter(p => !!p.discountPrice);
    } else if (filterParam === "new") {
      result = result.filter(p => p.isNewArrival);
    } else if (filterParam === "bestsellers") {
      result = result.filter(p => p.isBestSeller);
    } else if (filterParam === "trending") {
      result = result.filter(p => p.isFeatured);
    }

    if (searchParam) {
      const q = searchParam.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (selectedSubcategory) {
      result = result.filter(p => p.subcategory === selectedSubcategory);
    }

    if (selectedBrand) {
      result = result.filter(p => p.brand === selectedBrand);
    }

    if (minPrice !== "") {
      const min = Number(minPrice);
      result = result.filter(p => (p.discountPrice || p.price) >= min);
    }

    if (maxPrice !== "") {
      const max = Number(maxPrice);
      result = result.filter(p => (p.discountPrice || p.price) <= max);
    }

    // Sorting
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
        break;
      case "price-high":
        result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
        result.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
        break;
      case "popularity":
      default:
        result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
    }

    return result;
  }, [allProducts, selectedCategory, selectedSubcategory, selectedBrand, minPrice, maxPrice, sortBy, filterParam, searchParam]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  const resetAllFilters = () => {
    setSelectedCategory("");
    setSelectedSubcategory("");
    setSelectedBrand("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("popularity");
    router.push("/products");
  };

  const hasActiveFilters = Boolean(
    selectedCategory || selectedSubcategory || selectedBrand || minPrice !== "" || maxPrice !== "" || filterParam || searchParam
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
      <CategoryNavigation />
      <MobileNavigation isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: "Imported Catalog", href: "/products" }]} />

        {/* Page Title & Sort Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between py-4 border-b border-stone-200 gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-amber-800">
              Authentic Inventory
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950 mt-1">
              {filterParam === "deals"
                ? "Special Import Deals"
                : filterParam === "new"
                ? "New Arrivals in Port"
                : filterParam === "bestsellers"
                ? "Best-Selling Imported Goods"
                : "All Imported Products"}
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Showing {displayedProducts.length} of {filteredProducts.length} imported items
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile filter button */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl border border-stone-300 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters {hasActiveFilters && "•"}</span>
            </button>

            {/* Sort Select */}
            <div className="flex items-center gap-2">
              <label htmlFor="sortBy" className="text-xs text-stone-500 whitespace-nowrap hidden sm:inline">
                Sort By:
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white text-stone-900 text-xs font-semibold rounded-xl border border-stone-300 focus:outline-hidden focus:border-amber-700 shadow-xs cursor-pointer"
              >
                <option value="popularity">Most Popular</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 py-3 border-b border-stone-200 text-xs">
            <span className="text-stone-500 font-medium">Active Filters:</span>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full font-semibold">
                Category: {categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
                <button onClick={() => setSelectedCategory("")} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedSubcategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full font-semibold">
                Subcategory: {selectedSubcategory}
                <button onClick={() => setSelectedSubcategory("")} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedBrand && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 text-stone-800 border border-stone-300 rounded-full font-semibold">
                Brand: {selectedBrand}
                <button onClick={() => setSelectedBrand("")} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {(minPrice !== "" || maxPrice !== "") && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 text-stone-800 border border-stone-300 rounded-full font-semibold">
                Price: ৳{minPrice || 0} - ৳{maxPrice || "Any"}
                <button onClick={() => { setMinPrice(""); setMaxPrice(""); }} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={resetAllFilters}
              className="text-xs text-rose-700 hover:text-rose-900 font-semibold underline ml-2"
            >
              Reset All
            </button>
          </div>
        )}

        {/* Content Layout: Sidebar + Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 py-8 items-start">
          
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-6 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-amber-700" /> Filter Catalog
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="text-[11px] text-stone-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
                Categories
              </h4>
              <div className="space-y-1.5">
                <button
                  onClick={() => { setSelectedCategory(""); setSelectedSubcategory(""); }}
                  className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg flex items-center justify-between transition-colors ${
                    !selectedCategory ? "bg-amber-100 text-amber-950 font-bold" : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <span>All Categories</span>
                  <span>{allProducts.length}</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(selectedCategory === cat.slug ? "" : cat.slug);
                      setSelectedSubcategory("");
                    }}
                    className={`w-full text-left text-xs py-1.5 px-2.5 rounded-lg flex items-center justify-between transition-colors ${
                      selectedCategory === cat.slug
                        ? "bg-amber-100 text-amber-950 font-bold"
                        : "text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="text-stone-400 text-[11px]">({cat.itemCount})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategories (if category selected) */}
            {selectedCategory && (
              <div className="pt-3 border-t border-stone-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
                  Subcategories
                </h4>
                <div className="space-y-1">
                  {categories
                    .find(c => c.slug === selectedCategory)
                    ?.subcategories.map((sub, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedSubcategory(selectedSubcategory === sub ? "" : sub)}
                        className={`w-full text-left text-xs py-1 px-2 rounded-md flex items-center gap-2 ${
                          selectedSubcategory === sub
                            ? "text-amber-900 font-bold bg-amber-50"
                            : "text-stone-600 hover:text-stone-900"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          selectedSubcategory === sub ? "border-amber-800 bg-amber-800 text-white" : "border-stone-300"
                        }`}>
                          {selectedSubcategory === sub && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span className="truncate">{sub}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Price Range Filter */}
            <div className="pt-3 border-t border-stone-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
                Price (BDT ৳)
              </h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                />
                <span className="text-stone-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Brand Filter */}
            <div className="pt-3 border-t border-stone-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
                Imported Brands
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {brands.slice(0, 15).map((brand, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedBrand(selectedBrand === brand ? "" : brand)}
                    className={`w-full text-left text-xs py-1 px-2 rounded-md flex items-center gap-2 ${
                      selectedBrand === brand
                        ? "text-amber-900 font-bold bg-amber-50"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                      selectedBrand === brand ? "border-amber-800 bg-amber-800 text-white" : "border-stone-300"
                    }`}>
                      {selectedBrand === brand && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <span className="truncate">{brand}</span>
                  </button>
                ))}
              </div>
            </div>

          </aside>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <p role="status" className="py-12 text-center text-sm text-stone-500">Loading products...</p>
            ) : loadError ? (
              <EmptyState title="Products unavailable" description="We could not load products from the store. Please try again shortly." />
            ) : displayedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {displayedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Load More Button */}
                {visibleCount < filteredProducts.length && (
                  <div className="mt-12 text-center">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 12)}
                      className="px-8 py-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-full shadow-md transition-all"
                    >
                      Load More Products ({filteredProducts.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="No imported products match these filters"
                description="We couldn't find items matching your search or filters. Try adjusting price bounds, clearing categories, or exploring all products."
                actionLabel="Clear All Filters"
                actionHref="/products"
              />
            )}
          </div>

        </div>

      </main>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl p-5 overflow-y-auto z-50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <h3 className="font-serif font-bold text-lg text-stone-900">Filters</h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 rounded-lg text-stone-500 hover:text-stone-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              <div className="py-4 border-b border-stone-200">
                <h4 className="text-xs font-bold text-stone-500 uppercase mb-2">Categories</h4>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(selectedCategory === cat.slug ? "" : cat.slug);
                        setSelectedSubcategory("");
                      }}
                      className={`w-full text-left text-xs py-2 px-3 rounded-lg flex items-center justify-between ${
                        selectedCategory === cat.slug ? "bg-amber-100 text-amber-950 font-bold" : "text-stone-700"
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span>({cat.itemCount})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="py-4 border-b border-stone-200">
                <h4 className="text-xs font-bold text-stone-500 uppercase mb-2">Price (BDT)</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full p-2 border rounded-lg text-xs"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full p-2 border rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 flex gap-2">
              <button
                onClick={resetAllFilters}
                className="flex-1 py-2.5 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold"
              >
                Apply ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background p-12 text-center text-sm text-stone-500">Loading catalog...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
