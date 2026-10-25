"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "./ToastContext";
import { toMinorUnits, fromMinorUnits } from "@/lib/currency.mjs";
import { couponService } from "@/services/productService";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "novella_cart_v1";

const AVAILABLE_COUPONS = {
  "IMPORT10": { code: "IMPORT10", type: "percent", value: 10, minSpend: 0, desc: "10% off entire order" },
  "WELCOME500": { code: "WELCOME500", type: "flat", value: 500, minSpend: 2000, desc: "৳500 off on orders above ৳2,000" },
  "FREESHIP": { code: "FREESHIP", type: "shipping", value: 100, minSpend: 0, desc: "Free delivery nationwide" },
  "SAVE12": { code: "SAVE12", type: "percent", value: 12, minSpend: 1000, maxDiscount: 1500, desc: "12% off storewide discount" },
};

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [deliveryArea, setDeliveryArea] = useState("dhaka"); // "dhaka" or "outside"
  const [isLoaded, setIsLoaded] = useState(false);
  const { addToast } = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const storedItems = JSON.parse(stored);
        queueMicrotask(() => setItems(storedItems));
      }
    } catch (e) {
      console.warn("Could not load cart from storage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save cart to storage", e);
    }
  }, [items, isLoaded]);

  const addToCart = (product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { id: product.id, product, quantity }];
      }
    });
    addToast(`Added "${product.name.slice(0, 32)}..." to cart`, "success");
  };

  const removeFromCart = (productId) => {
    const itemToRemove = items.find(i => i.product.id === productId);
    setItems(prev => prev.filter(item => item.product.id !== productId));
    if (itemToRemove) {
      addToast(`Removed item from cart`, "info");
    }
  };

  const updateQuantity = (productId, delta) => {
    setItems(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  };

  const applyCoupon = async (code) => {
    const cleanCode = String(code || "").toUpperCase().trim();
    if (!cleanCode) return false;

    try {
      const res = await couponService.validateCoupon(cleanCode, subtotal);
      if (res?.valid && res.coupon) {
        const c = res.coupon;
        const couponObj = {
          code: c.code,
          type: c.discountType,
          value: c.discountValue,
          maxDiscount: c.maxDiscount,
          minSpend: c.minSpend,
          desc: c.description,
          freeShipping: Boolean(c.freeShipping),
        };
        setAppliedCoupon(couponObj);
        addToast(`Coupon "${c.code}" applied: ${c.description}`, "success");
        return true;
      }
    } catch (err) {
      if (err.message && !err.message.includes("failed to fetch") && !err.message.includes("The API request failed")) {
        addToast(err.message, "error");
        return false;
      }
    }

    const coupon = AVAILABLE_COUPONS[cleanCode];
    if (!coupon) {
      addToast("Invalid coupon code.", "error");
      return false;
    }

    if (coupon.minSpend > 0 && subtotal < coupon.minSpend) {
      addToast(`Minimum order of ৳${coupon.minSpend} required for this coupon`, "error");
      return false;
    }

    setAppliedCoupon(coupon);
    addToast(`Coupon "${cleanCode}" applied: ${coupon.desc}`, "success");
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    addToast("Coupon removed", "info");
  };

  // Calculations. Keep money in integer paisa so fractional product prices
  // cannot accumulate floating-point noise in the displayed totals.
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  const subtotalMinor = items.reduce((sum, item) => {
    const unitMinor = toMinorUnits(item.product.discountPrice || item.product.price) || 0;
    return sum + unitMinor * item.quantity;
  }, 0);
  const subtotal = fromMinorUnits(subtotalMinor);

  // Free shipping threshold = ৳3,000
  const standardShippingMinor = deliveryArea === "dhaka" ? 12000 : 18000;
  let shippingMinor = subtotalMinor >= 300000 ? 0 : standardShippingMinor;

  let discountMinor = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percent") {
      let calc = Math.round((subtotalMinor * appliedCoupon.value) / 100);
      if (appliedCoupon.maxDiscount) {
        const maxCapMinor = toMinorUnits(appliedCoupon.maxDiscount);
        if (maxCapMinor !== null && calc > maxCapMinor) calc = maxCapMinor;
      }
      discountMinor = calc;
    } else if (appliedCoupon.type === "flat") {
      discountMinor = Math.min(toMinorUnits(appliedCoupon.value) || 0, subtotalMinor);
    } else if (appliedCoupon.type === "shipping" || appliedCoupon.freeShipping) {
      shippingMinor = 0;
    }
  }

  const shippingFee = fromMinorUnits(shippingMinor);
  const discount = fromMinorUnits(discountMinor);
  const freeShippingRemaining = fromMinorUnits(Math.max(0, 300000 - subtotalMinor));
  const total = fromMinorUnits(Math.max(0, subtotalMinor - discountMinor + shippingMinor));

  return (
    <CartContext.Provider
      value={{
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
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isLoaded
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
