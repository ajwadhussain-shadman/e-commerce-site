"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import ProductCard from "@/components/products/ProductCard";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { products } from "@/data/products";

export default function HorizontalProductSection({ title, products: sectionProducts, filter, gradient }) {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      handleScroll();
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [sectionProducts]);

  const handleScrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -400, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 400, behavior: "smooth" });
    }
  };

  return (
    <section className={`py-12 ${gradient}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-stone-900 mb-2">{title}</h2>
            <Link
              href={filter ? `/products?filter=${encodeURIComponent(filter)}` : "/products"}
              className="text-sm text-orange-600 hover:text-orange-700 font-semibold"
            >
              {t("home.exploreAllTrending")}
              <ArrowRight className="w-4 h-4 inline-block ml-1" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleScrollLeft}
              disabled={!canScrollLeft}
              className="p-2 bg-white hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-sm border border-stone-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-stone-600" />
            </button>
            <button
              onClick={handleScrollRight}
              disabled={!canScrollRight}
              className="p-2 bg-white hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-sm border border-stone-200 transition-colors"
            >
              <ArrowRight className="w-5 h-5 text-stone-600" />
            </button>
          </div>
        </div>

        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {sectionProducts.map((product) => (
            <div key={product.id} className="shrink-0 snap-start w-full sm:w-64 md:w-72">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}