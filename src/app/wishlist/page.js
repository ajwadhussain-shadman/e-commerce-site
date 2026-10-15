"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/components/common/SiteHeader";
import CategoryNavigation from "@/components/common/CategoryNavigation";
import MobileNavigation from "@/components/common/MobileNavigation";
import SiteFooter from "@/components/common/SiteFooter";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import EmptyState from "@/components/common/EmptyState";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";

export default function WishlistPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { wishlist, removeFromWishlist, isLoaded } = useWishlist();
  const { addToCart } = useCart();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center text-stone-500 text-sm">
        Loading wishlist...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf9]">
      <SiteHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
      <CategoryNavigation />
      <MobileNavigation isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <Breadcrumbs items={[{ label: "Saved Wishlist" }]} />

        <div className="py-4 border-b border-stone-200 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950 flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-600 fill-rose-600" /> My Saved Wishlist ({wishlist.length})
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Keep track of imported favorites and quickly transfer items to your shopping cart.
            </p>
          </div>
        </div>

        {wishlist.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {wishlist.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-square w-full bg-stone-100">
                  <Link href={`/products/${product.slug}`} className="block w-full h-full">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </Link>
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-rose-50 text-stone-500 hover:text-rose-600 rounded-full shadow-sm transition-colors"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                      {product.brand}
                    </span>
                    <Link href={`/products/${product.slug}`} className="block">
                      <h3 className="text-xs sm:text-sm font-semibold text-stone-900 hover:text-amber-900 transition-colors line-clamp-2 mt-0.5">
                        {product.name}
                      </h3>
                    </Link>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-sm sm:text-base font-bold text-stone-950 font-serif">
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
                      onClick={() => {
                        addToCart(product, 1);
                        removeFromWishlist(product.id);
                      }}
                      className="w-full py-2.5 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-300" /> Move to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            title="Your Wishlist is Empty"
            description="Explore our imported chocolates, Asian noodles, European breakfast cereals, and sneakers to save your favorites."
            actionLabel="Discover Products"
            actionHref="/products"
          />
        )}

      </main>

      <SiteFooter />
    </div>
  );
}
