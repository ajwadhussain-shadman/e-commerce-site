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
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Trash2,
  ArrowRight,
  Tag,
  Truck,
  X,
} from "lucide-react";

export default function CartPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");

  const {
    items,
    itemCount,
    subtotal,
    discount,
    shippingFee,
    total,
    deliveryArea,
    setDeliveryArea,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    freeShippingRemaining,
    updateQuantity,
    removeFromCart,
    clearCart,
    isLoaded
  } = useCart();

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput.trim());
      setCouponInput("");
    }
  };

if (!isLoaded) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center text-stone-500 text-sm">
          Loading cart...
        </div>
      );
    }

  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
      <CategoryNavigation />
      <MobileNavigation isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <Breadcrumbs items={[{ label: t("cart.shoppingCart") }]} />
                      className="bg-amber-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (subtotal / 3000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Items Table / Cards */}
              <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs divide-y divide-stone-100 overflow-hidden">
                {items.map((item) => {
                  const product = item.product;
                  const unitPrice = product.discountPrice || product.price;
                  const itemTotal = unitPrice * item.quantity;

                  return (
                    <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      
                      {/* Product Image & Title */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                            {product.brand}
                          </div>
                          <Link
                            href={`/products/${product.slug}`}
                            className="text-sm font-semibold text-stone-900 hover:text-amber-900 transition-colors line-clamp-1"
                          >
                            {product.name}
                          </Link>
                          <div className="text-xs text-stone-500 mt-0.5">
                            Unit: {product.size || "Standard"} • ৳{unitPrice} each
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controller & Total Price */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        
                        <div className="flex items-center border border-stone-300 rounded-xl bg-stone-50">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, -1)}
                            className="p-1.5 text-stone-600 hover:text-stone-950"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-stone-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, 1)}
                            className="p-1.5 text-stone-600 hover:text-stone-950"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right min-w-[80px]">
                          <div className="text-sm font-bold text-stone-950 font-serif">
                            ৳{itemTotal}
                          </div>
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Continue Shopping button */}
              <div className="pt-2">
                <Link
                  href="/products"
                  className="text-xs font-semibold text-stone-700 hover:text-amber-800 transition-colors inline-flex items-center gap-1"
                >
                  ← Continue Shopping for More Imported Treats
                </Link>
              </div>

            </div>

            {/* Right: Order Summary Card */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-md space-y-6 sticky top-24">
              <h2 className="text-lg font-serif font-bold text-stone-950 pb-3 border-b border-stone-100">
                Order Summary
              </h2>

              {/* Delivery Destination Toggle */}
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-2">
                  Delivery Destination:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDeliveryArea("dhaka")}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                      deliveryArea === "dhaka"
                        ? "bg-amber-50 border-amber-800 text-amber-950"
                        : "border-stone-200 text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    Inside Dhaka (৳120)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryArea("outside")}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                      deliveryArea === "outside"
                        ? "bg-amber-50 border-amber-800 text-amber-950"
                        : "border-stone-200 text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    Outside Dhaka (৳180)
                  </button>
                </div>
              </div>

              {/* Coupon Input Form */}
              <div>
                <label htmlFor="cartCoupon" className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Promotional Coupon Code:
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      {appliedCoupon.code} ({appliedCoupon.desc})
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="p-1 hover:text-red-700"
                      aria-label="Remove coupon"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      id="cartCoupon"
                      type="text"
                      placeholder="Try 'IMPORT10' or 'WELCOME500'"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-stone-50 text-stone-900 placeholder-stone-400 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-amber-700"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                    >
                      Apply
                    </button>
                  </form>
                )}
              </div>

              {/* Calculations breakdown */}
              <div className="space-y-2.5 text-xs text-stone-600 border-t border-stone-100 pt-4">
                <div className="flex justify-between">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="font-semibold text-stone-900">৳{subtotal}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-৳{discount}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="font-semibold text-stone-900">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-700 font-bold uppercase tracking-wider">
                        FREE
                      </span>
                    ) : (
                      `৳${shippingFee}`
                    )}
                  </span>
                </div>

                <div className="border-t border-stone-200 pt-3 flex justify-between items-baseline text-base font-bold text-stone-950 font-serif">
                  <span>Total Amount</span>
                  <span className="text-xl text-amber-900">৳{total}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <Link
                href="/checkout"
                className="w-full py-4 bg-stone-950 hover:bg-stone-800 text-white rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Security info */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cash on Delivery & Secure Demo Checkout</span>
              </div>

            </div>

          </div>
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title="Your Shopping Cart is Empty"
            description="You haven't added any imported chocolates, ramen, oats, or sneakers yet. Explore our fresh global arrivals!"
            actionLabel="Start Shopping"
            actionHref="/products"
          />
        )}

      </main>

      <SiteFooter />
    </div>
  );
}
