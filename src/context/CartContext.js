"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "./ToastContext";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "novella_cart_v1";

const AVAILABLE_COUPONS = {
  "IMPORT10": { code: "IMPORT10", type: "percent", value: 10, minSpend: 0, desc: "10% off entire order" },
  "WELCOME500": { code: "WELCOME500", type: "flat", value: 500, minSpend: 2000, desc: "৳500 off on orders above ৳2,000" },
  "FREESHIP": { code: "FREESHIP", type: "shipping", value: 100, minSpend: 0, desc: "Free delivery nationwide" }
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
        setItems(JSON.parse(stored));
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

  const applyCoupon = (code) => {
    const cleanCode = code.toUpperCase().trim();
    const coupon = AVAILABLE_COUPONS[cleanCode];

    if (!coupon) {
      addToast("Invalid coupon code. Try 'IMPORT10' or 'WELCOME500'", "error");
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

  // Calculations
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => {
    const unitPrice = item.product.discountPrice || item.product.price;
    return sum + unitPrice * item.quantity;
  }, 0);

  // Free shipping threshold = ৳3,000
  let standardShippingFee = deliveryArea === "dhaka" ? 120 : 180;
  let shippingFee = subtotal >= 3000 ? 0 : standardShippingFee;

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percent") {
      discount = Math.round((subtotal * appliedCoupon.value) / 100);
    } else if (appliedCoupon.type === "flat") {
      discount = Math.min(appliedCoupon.value, subtotal);
    } else if (appliedCoupon.type === "shipping") {
      shippingFee = 0;
    }
  }

  const freeShippingRemaining = Math.max(0, 3000 - subtotal);
  const total = Math.max(0, subtotal - discount + shippingFee);

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
