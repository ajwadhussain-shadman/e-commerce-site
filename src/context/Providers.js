"use client";

import React from "react";
import { ThemeProvider } from "./ThemeContext";
import { LanguageProvider } from "./LanguageContext";
import { ToastProvider } from "./ToastContext";
import { AuthProvider } from "./AuthContext";
import { WishlistProvider } from "./WishlistContext";
import { CartProvider } from "./CartContext";

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>{children}</CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
