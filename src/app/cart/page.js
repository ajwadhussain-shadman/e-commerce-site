"use client";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/common/SiteHeader";
import CategoryNavigation from "@/components/common/CategoryNavigation";
import MobileNavigation from "@/components/common/MobileNavigation";
import SiteFooter from "@/components/common/SiteFooter";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import EmptyState from "@/components/common/EmptyState";
import ProductImage from "@/components/products/ProductImage";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatBDT } from "@/lib/currency.mjs";
import { getPrimaryImage } from "@/lib/product-images.mjs";
import {
  Trash2,
  ArrowRight,
  Truck,
  X,
  ShoppingBag,
  Minus,
  Plus,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default function CartPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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

  const { t } = useLanguage();

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput.trim());
      setCouponInput("");
    }
  };

if (!isLoaded) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
          Loading cart...
        </div>
      );
    }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
      <CategoryNavigation />
      <MobileNavigation isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <Breadcrumbs items={[{ label: t("cart.shoppingCart") }]} />

        {/* Page Header */}
        <div className="py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
              Shopping Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review your authentic imported goods before proceeding to secure checkout.
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-xs text-muted-foreground hover:text-rose-600 transition-colors self-start sm:self-auto flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All Items
            </button>
          )}
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 items-start">

            {/* Left: Cart Items */}
            <div className="lg:col-span-8 space-y-4">

              {/* Free Shipping Progress */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center gap-3">
                <Truck className="w-5 h-5 text-amber-700 shrink-0" />
                <div className="flex-1 text-xs">
                  {subtotal >= 3000 ? (
                    <span className="font-bold text-emerald-800">
                      🎉 You have unlocked FREE Nationwide Delivery!
                    </span>
                  ) : (
                    <span>
                      Add <strong>{formatBDT(freeShippingRemaining)}</strong> more imported items to get{" "}
                      <strong>FREE Delivery</strong> across Bangladesh!
                    </span>
                  )}
                  <div className="w-full bg-amber-200/60 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (subtotal / 3000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Items Table / Cards */}
              <div className="bg-surface rounded-3xl border border-border/80 shadow-xs divide-y divide-border overflow-hidden">
                {items.map((item) => {
                  const product = item.product;
                  const unitPrice = product.discountPrice || product.price;
                  const itemTotal = unitPrice * item.quantity;

                  return (
                    <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      
                      {/* Product Image & Title */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-surface-muted shrink-0 border border-border">
                          <ProductImage
                            src={getPrimaryImage(product)}
                            alt={product.name}
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
                            className="text-sm font-semibold text-foreground hover:text-amber-900 transition-colors line-clamp-1"
                          >
                            {product.name}
                          </Link>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Unit: {product.size || "Standard"} • {formatBDT(unitPrice)} each
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controller & Total Price */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        
                        <div className="flex items-center border border-border rounded-xl bg-surface-muted">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, -1)}
                            className="p-1.5 text-muted-foreground hover:text-foreground"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, 1)}
                            className="p-1.5 text-muted-foreground hover:text-foreground"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right min-w-[80px]">
                          <div className="text-sm font-bold text-foreground font-serif">
                            {formatBDT(itemTotal)}
                          </div>
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          className="p-1.5 text-muted-foreground hover:text-rose-600 transition-colors"
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
                  className="text-xs font-semibold text-foreground hover:text-amber-800 transition-colors inline-flex items-center gap-1"
                >
                  ← Continue Shopping for More Imported Treats
                </Link>
              </div>

            </div>

            {/* Right: Order Summary Card */}
            <div className="lg:col-span-4 bg-surface p-6 rounded-3xl border border-border/90 shadow-md space-y-6 sticky top-24">
              <h2 className="text-lg font-serif font-bold text-foreground pb-3 border-b border-border">
                Order Summary
              </h2>

              {/* Delivery Destination Toggle */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-2">
                  Delivery Destination:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDeliveryArea("dhaka")}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                      deliveryArea === "dhaka"
                        ? "bg-amber-50 border-amber-800 text-amber-950"
                        : "border-border text-muted-foreground hover:bg-surface-muted"
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
                        : "border-border text-muted-foreground hover:bg-surface-muted"
                    }`}
                  >
                    Outside Dhaka (৳180)
                  </button>
                </div>
              </div>

              {/* Coupon Input Form */}
              <div>
                <label htmlFor="cartCoupon" className="text-xs font-semibold text-foreground block mb-1.5">
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
                      className="flex-1 px-3 py-2 bg-surface-muted text-foreground placeholder-stone-400 text-xs rounded-xl border border-border focus:outline-hidden focus:border-amber-700"
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
              <div className="space-y-2.5 text-xs text-muted-foreground border-t border-border pt-4">
                <div className="flex justify-between">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="font-semibold text-foreground">{formatBDT(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-{formatBDT(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="font-semibold text-foreground">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-700 font-bold uppercase tracking-wider">
                        FREE
                      </span>
                    ) : (
                      formatBDT(shippingFee)
                    )}
                  </span>
                </div>

                <div className="border-t border-border pt-3 flex justify-between items-baseline text-base font-bold text-foreground font-serif">
                  <span>Total Amount</span>
                  <span className="text-xl text-amber-900">{formatBDT(total)}</span>
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
              <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground pt-1">
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

      <ConfirmationModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          clearCart();
          setShowClearConfirm(false);
        }}
        title="Clear your shopping cart?"
        message="Are you sure you want to remove all items from your shopping cart? This cannot be undone."
        variant="danger"
        confirmText="Clear Cart"
      />

      <SiteFooter />
    </div>
  );
}
