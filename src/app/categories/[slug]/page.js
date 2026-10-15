"use client";

import { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/common/SiteHeader";
import CategoryNavigation from "@/components/common/CategoryNavigation";
import MobileNavigation from "@/components/common/MobileNavigation";
import SiteFooter from "@/components/common/SiteFooter";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ProductCard from "@/components/products/ProductCard";
import EmptyState from "@/components/common/EmptyState";
import { categories } from "@/data/categories";
import { productService } from "@/services/productService";
import { ArrowLeft, Check, Sparkles } from "lucide-react";

export default function CategoryPage({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const category = categories.find((c) => c.slug === slug);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const data = await productService.getAllProducts({ category: slug });
      setCategoryProducts(data);
      setIsLoading(false);
    }
    if (category) {
      load();
    }
  }, [slug, category]);

  if (!category) {
    return notFound();
  }

  const filteredProducts = useMemo(() => {
    let list = [...categoryProducts];
    if (selectedSubcategory) {
      list = list.filter(p => p.subcategory === selectedSubcategory);
    }

    switch (sortBy) {
      case "price-low":
        list.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
        break;
      case "price-high":
        list.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
        break;
      case "rating":
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
        list.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
        break;
      case "popularity":
      default:
        list.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
    }
    return list;
  }, [categoryProducts, selectedSubcategory, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf9]">
      <SiteHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
      <CategoryNavigation />
      <MobileNavigation isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Categories", href: "/products" },
            { label: category.name }
          ]}
        />

        {/* Category Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-stone-900 text-white min-h-[220px] sm:min-h-[260px] flex flex-col justify-end p-6 sm:p-10 mb-8 shadow-lg">
          <Image
            src={category.banner}
            alt={category.name}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-45"
          />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Authentic Imported Selection
            </span>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white leading-tight">
              {category.name}
            </h1>
            <p className="text-xs sm:text-sm text-stone-200 mt-2 leading-relaxed">
              {category.description}
            </p>
          </div>
        </div>

        {/* Subcategories Filter Chips & Sort Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-stone-200 gap-4">
          
          {/* Subcategory Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedSubcategory("")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                !selectedSubcategory
                  ? "bg-amber-900 text-white shadow-xs"
                  : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              All {category.name} ({categoryProducts.length})
            </button>
            {category.subcategories.map((sub, i) => (
              <button
                key={i}
                onClick={() => setSelectedSubcategory(selectedSubcategory === sub ? "" : sub)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  selectedSubcategory === sub
                    ? "bg-amber-900 text-white shadow-xs"
                    : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <label htmlFor="catSort" className="text-xs text-stone-500">Sort by:</label>
            <select
              id="catSort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-white text-stone-900 text-xs font-semibold rounded-xl border border-stone-300 shadow-xs cursor-pointer focus:outline-hidden"
            >
              <option value="popularity">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

        </div>

        {/* Products Grid */}
        <div className="py-8">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={`No products in this subcategory`}
              description="Try selecting another subcategory or browsing all products in this category."
              actionLabel="View All In This Category"
              actionHref={`/categories/${category.slug}`}
            />
          )}
        </div>

      </main>

      <SiteFooter />
    </div>
  );
}
