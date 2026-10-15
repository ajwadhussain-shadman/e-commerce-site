"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    setIsAdding(true);
    addToCart(product, 1);
    setTimeout(() => setIsAdding(false), 800);
  };

  return (
    <div className="group bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full">
      <div className="relative aspect-square bg-stone-50 overflow-hidden">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Product Name */}
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="text-sm font-semibold text-stone-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price & Add to Cart button */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-stone-900">
              ৳{product.discountPrice || product.price}
            </span>
            {product.discountPrice && (
              <span className="text-xs text-stone-400 line-through">
                ৳{product.price}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`p-2 rounded-lg font-semibold text-xs transition-all flex items-center gap-1 bg-stone-900 hover:bg-stone-800 text-white ${isAdding ? "opacity-50 cursor-not-allowed" : "active:scale-95"
              }`}
            aria-label="Add to cart"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className={`-mt-px ${isAdding ? "hidden" : ""}`}>
              {t("product.addToCart")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}