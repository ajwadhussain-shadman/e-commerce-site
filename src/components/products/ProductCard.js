"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";
import { formatBDT } from "@/lib/currency.mjs";
import { getPrimaryImage } from "@/lib/product-images.mjs";
import ProductImage from "@/components/products/ProductImage";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { t, language } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    setIsAdding(true);
    addToCart(product, 1);
    setTimeout(() => setIsAdding(false), 800);
  };

  return (
    <div className="group bg-surface border border-border rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full">
      <div className="relative aspect-square bg-surface-muted overflow-hidden">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          <ProductImage
            src={getPrimaryImage(product)}
            alt={product.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Product Name */}
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price & Add to Cart button */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-foreground">
              {formatBDT(product.discountPrice || product.price)}
            </span>
            {product.discountPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatBDT(product.price)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`h-9 w-9 md:h-auto md:w-auto shrink-0 p-2 md:px-3 md:py-2 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1 bg-stone-900 hover:bg-stone-800 text-white dark:bg-primary dark:hover:bg-primary-hover dark:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${isAdding ? "opacity-50 cursor-not-allowed" : "active:scale-95"
              }`}
            aria-label={language === "bn" ? "কার্টে যোগ করুন" : "Add to Cart"}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className={`-mt-px hidden md:inline ${isAdding ? "md:hidden" : ""}`}>
              {t("product.addToCart")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
