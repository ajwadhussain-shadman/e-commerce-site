"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  ChevronDown,
  LogOut,
  PackageCheck,
  ArrowRight,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { productService } from "@/services/productService";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import ProductImage from "@/components/products/ProductImage";
import { hasAdminRole } from "@/lib/auth-access.mjs";
import { formatBDT } from "@/lib/currency.mjs";
import { getPrimaryImage } from "@/lib/product-images.mjs";
import Logo from "./Logo";

function useCategoryLabel() {
  const { t } = useLanguage();
  return useCallback((slug) => {
    const value = t(`categories.${slug}`);
    return value === `categories.${slug}` ? slug : value;
  }, [t]);
}

export default function SiteHeader({ onOpenMobileMenu, compact = false }) {
  const router = useRouter();
  // `subtotal` is intentionally not read here: the navbar shows the cart's
  // item count only, never a price.
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const categoryLabel = useCategoryLabel();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);

  const searchRef = useRef(null);
  const accountRef = useRef(null);

  useEffect(() => {
    let active = true;
    productService.getAllProducts().then((records) => { if (active) setCatalogProducts(records); }).catch(() => { if (active) setCatalogProducts([]); });
    return () => { active = false; };
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return catalogProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.subcategory.toLowerCase().includes(query) ||
          categoryLabel(p.category).toLowerCase().includes(query)
      )
      .slice(0, 5);
  }, [catalogProducts, searchQuery, categoryLabel]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setIsAccountOpen(false);
      }
    }

    // Escape dismisses whichever popover is open, so the menus are usable
    // from the keyboard without reaching for the mouse.
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
        setIsAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      setMobileSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const showMobileSearchRow = !compact || mobileSearchOpen;

  return (
    <header className="bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 lg:h-24 lg:pb-4">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 -ml-1 text-foreground hover:text-foreground rounded-lg hover:bg-surface-muted transition-colors shrink-0"
            aria-label={t("header.openMenu")}
          >
            <Menu className="w-6 h-6" />
          </button>

          <Logo size="md" />

          {/* Desktop Search Bar */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-lg relative mx-2 lg:mx-4">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                placeholder={t("header.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                aria-label={t("header.search")}
                className="w-full pl-10 pr-20 py-2.5 bg-surface-muted hover:bg-surface-warm focus:bg-surface text-foreground placeholder:text-muted-foreground text-sm rounded-full border border-border focus:outline-none focus:border-orange-500 transition-all"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold rounded-full transition-colors"
              >
                {t("header.search")}
              </button>
            </form>

            {/* Live Autocomplete Dropdown */}
            {isSearchOpen && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-2xl shadow-xl border border-border overflow-hidden z-50">
                {searchResults.length > 0 ? (
                  <div className="p-2">
                    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("header.matchingProducts")}
                    </div>
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center gap-3 p-2 hover:bg-surface-muted rounded-xl transition-colors group"
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-surface-muted shrink-0 border border-border">
                          <ProductImage
                            src={getPrimaryImage(product)}
                            alt={product.name}
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-muted-foreground line-clamp-1">
                            {product.brand} • {product.countryOfOrigin}
                          </div>
                          <div className="text-sm font-semibold text-foreground truncate group-hover:text-orange-600 transition-colors">
                            {product.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-foreground">
                              {formatBDT(product.discountPrice || product.price)}
                            </span>
                            {product.discountPrice && (
                              <span className="text-[11px] text-muted-foreground line-through">
                                {formatBDT(product.price)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                    <Link
                      href={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center justify-center gap-1.5 py-2.5 mt-1 border-t border-border text-xs font-semibold text-orange-600 hover:bg-orange-50 transition-colors"
                    >
                      {t("header.viewAllResults")} {searchQuery} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {t("header.noProductsFound")} {searchQuery}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="ml-auto flex items-center gap-0.5 sm:gap-1 lg:ml-0 lg:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="md:hidden p-2 text-foreground hover:bg-surface-muted rounded-full transition-colors"
              aria-label={t("header.search")}
              aria-expanded={mobileSearchOpen}
            >
              <Search className="w-5 h-5" />
            </button>

            <LanguageSwitcher variant="inline" className="hidden lg:flex" />
            <ThemeToggle className="hidden lg:flex" />

            <div ref={accountRef} className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                className="flex items-center gap-2 p-2 text-muted-foreground hover:bg-surface-muted rounded-full transition-colors"
                aria-label={t("header.myAccount")}
                aria-haspopup="menu"
                aria-expanded={isAccountOpen}
              >
                <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center overflow-hidden">
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "Profile"}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {isAuthenticated ? t("header.myAccount") : t("header.signIn")}
                  </span>
                  <span className="text-xs font-semibold text-foreground truncate">
                    {isAuthenticated ? user?.name : t("header.guestUser")}
                  </span>
                </div>
                <ChevronDown className="hidden xl:block w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {isAccountOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface rounded-2xl shadow-xl border border-border py-2 z-50">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center overflow-hidden shrink-0">
                      {user?.image ? (
                        <img
                          src={user.image}
                          alt={user.name || "Profile"}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{t("header.signedInAs")}</p>
                      <p className="text-sm font-semibold text-foreground truncate">
                        {user?.name || t("header.guest")}
                      </p>
                      <p className="text-[11px] text-orange-600 truncate">
                        {user?.email || t("header.guest")}
                      </p>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/account"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                    >
                      <User className="w-4 h-4" /> {t("header.accountProfile")}
                    </Link>
                    <Link
                      href="/account#orders"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                    >
                      <PackageCheck className="w-4 h-4" /> {t("header.myOrders")}
                    </Link>
                    <Link
                      href="/wishlist"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                    >
                      <Heart className="w-4 h-4" /> {t("header.savedWishlist")} ({wishlistCount})
                    </Link>
                    {hasAdminRole(user) && <Link
                      href="/admin"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> {t("header.adminPanel")}
                    </Link>}
                  </div>

                  <div className="border-t border-border pt-1">
                    {isAuthenticated ? (
                      <button
                        onClick={() => {
                          logout();
                          setIsAccountOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> {t("header.signOut")}
                      </button>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted"
                      >
                        {t("header.signInRegister")}
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/wishlist"
              className="relative p-2 text-muted-foreground hover:bg-surface-muted hover:text-foreground rounded-full transition-colors"
              aria-label={t("header.wishlist")}
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-primary text-on-primary rounded-full text-[10px] font-bold flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="relative p-2 text-muted-foreground hover:bg-surface-muted hover:text-foreground rounded-full transition-colors"
              aria-label={`${t("header.cart")} (${itemCount})`}
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white rounded-full text-[10px] font-bold w-3 h-3 flex items-center justify-center leading-none">
                    {itemCount}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>

        <div
          className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-200 ${showMobileSearchRow ? "max-h-16 opacity-100 pb-3" : "max-h-0 opacity-0"
            }`}
        >
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder={t("header.searchPlaceholderMobile")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={t("header.search")}
              className="w-full pl-10 pr-20 py-2 bg-surface-muted text-foreground placeholder:text-muted-foreground text-xs rounded-full border border-border focus:outline-none focus:border-orange-500"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary hover:bg-primary-hover text-on-primary text-[11px] font-semibold rounded-full transition-colors"
            >
              {t("header.search")}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
