"use client";

import Link from "next/link";
import Image from "next/image";
import { categories } from "@/data/categories";
import { X, User, Heart, ShoppingBag, ShieldCheck, Phone, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import { hasAdminRole } from "@/lib/auth-access.mjs";

export default function MobileNavigation({ isOpen, onClose }) {
  const { user, isAuthenticated } = useAuth();
  const { wishlistCount } = useWishlist();
  const { itemCount } = useCart();
  const { t } = useLanguage();

  if (!isOpen) return null;

  const catLabel = (cat) => {
    const value = t(`categories.${cat.slug}`);
    return value === `categories.${cat.slug}` ? cat.name : value;
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-surface dark:bg-surface shadow-2xl flex flex-col z-50 overflow-y-auto">
        {/* Header */}
        <div className="p-4 bg-foreground dark:bg-surface-warm text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Lockup already contains the wordmark — no duplicate text logo. */}
            <span className="logo-plate inline-flex items-center justify-center rounded-lg bg-white p-0.5 shadow-xs">
              <Image
                src="/img/logo2.png?v=20261015"
                alt="Importora"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
            </span>
            <p className="text-[10px] text-primary tracking-widest uppercase">
              {t("header.importedGoods")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-surface-muted/50 transition-colors"
            aria-label={t("common.close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Quick Info */}
        <div className="p-4 bg-surface-muted/50 dark:bg-surface-muted/50 border-b border-border dark:border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-muted dark:bg-surface-muted flex items-center justify-center text-foreground/70 dark:text-foreground/70 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground dark:text-foreground truncate">
                {isAuthenticated ? user?.name : t("mobileNav.welcomeGuest")}
              </div>
              <div className="text-[11px] text-stone-500 truncate">
                {isAuthenticated ? user?.email : t("mobileNav.signInAccess")}
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
            <Link
              href="/account"
              onClick={onClose}
              className="py-2 px-2 bg-surface dark:bg-surface rounded-lg border border-border dark:border-border text-foreground/80 dark:text-foreground/80 font-medium hover:bg-surface-muted dark:hover:bg-surface-muted"
            >
              {t("mobileNav.account")}
            </Link>
            {hasAdminRole(user) && <Link
              href="/admin"
              onClick={onClose}
              className="py-2 px-2 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/30 dark:border-primary/30 text-primary dark:text-primary font-semibold hover:bg-primary/20 dark:hover:bg-primary/30"
            >
              {t("mobileNav.adminPanel")}
            </Link>}
          </div>
        </div>

        {/* Language & Theme settings */}
        <div className="p-4 border-b border-border dark:border-border">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
            {t("mobileNav.settings")}
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="list" className="flex-1" />
            <ThemeToggle className="border border-border dark:border-border shrink-0" />
          </div>
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 p-4">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
            {t("mobileNav.productCategories")}
          </div>
          <ul className="space-y-1">
            <li>
              <Link
                href="/products"
                onClick={onClose}
                className="flex items-center justify-between p-2.5 rounded-xl text-foreground dark:text-foreground font-semibold hover:bg-surface-muted dark:hover:bg-surface-muted text-sm"
              >
                <span>{t("mobileNav.allImportedProducts")}</span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/categories/${cat.slug}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-2.5 rounded-xl text-foreground/70 dark:text-foreground/70 hover:text-foreground dark:hover:text-foreground hover:bg-surface-muted dark:hover:bg-surface-muted text-sm"
                >
                  <span>{catLabel(cat)}</span>
                  <span className="text-xs text-stone-400">({cat.itemCount})</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 pt-4 border-t border-border dark:border-border">
            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
              {t("mobileNav.quickShortcuts")}
            </div>
            <ul className="space-y-1 text-sm font-medium text-foreground/70 dark:text-foreground/70">
              <li>
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-muted dark:hover:bg-surface-muted"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-stone-500" /> {t("mobileNav.myShoppingCart")}
                  </span>
                  <span className="text-xs bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-bold px-2 py-0.5 rounded-full">
                    {itemCount}
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/wishlist"
                  onClick={onClose}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-muted dark:hover:bg-surface-muted"
                >
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-stone-500" /> {t("mobileNav.wishlist")}
                  </span>
                  <span className="text-xs bg-surface-muted text-muted-foreground font-bold px-2 py-0.5 rounded-full">
                    {wishlistCount}
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/track-order"
                  onClick={onClose}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-muted dark:hover:bg-surface-muted"
                >
                  <ShieldCheck className="w-4 h-4 text-stone-500" /> {t("mobileNav.trackMyOrder")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-surface-muted/50 dark:bg-surface-muted/50 border-t border-border dark:border-border text-xs text-stone-500 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-foreground/70 dark:text-foreground/70 font-medium">
            <Phone className="w-4 h-4 text-primary" /> {t("mobileNav.hotline")}: +880 1700-000000
          </div>
          <div>{t("mobileNav.locationInfo")}</div>
        </div>
      </div>
    </div>
  );
}
