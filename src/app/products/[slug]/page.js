"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, notFound } from "next/navigation";
import SiteHeader from "@/components/common/SiteHeader";
import CategoryNavigation from "@/components/common/CategoryNavigation";
import MobileNavigation from "@/components/common/MobileNavigation";
import SiteFooter from "@/components/common/SiteFooter";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ProductCard from "@/components/products/ProductCard";
import ProductImage from "@/components/products/ProductImage";
import { productService, reviewService } from "@/services/productService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { categories } from "@/data/categories";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatBDT } from "@/lib/currency.mjs";
import { getProductImages } from "@/lib/product-images.mjs";
import {
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Star,
  Plus,
  Minus,
  Check,
  Sparkles,
  Zap,
  Globe2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function ProductDetailPage({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user, isLoaded } = useAuth();
  const { addToast } = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description"); // "description", "specs", "shipping", "reviews"
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", text: "" });
  const [reviewError, setReviewError] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [reviewOwnerId, setReviewOwnerId] = useState("");

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const found = await productService.getProductBySlug(slug);
      if (found) {
        setProduct(found);
        setSelectedImageIndex(0);
        setQuantity(1);
        const related = await productService.getRelatedProducts(found, 4);
        setRelatedProducts(related);
      }
      setIsLoading(false);
    }
    load();
  }, [slug]);

  useEffect(() => {
    if (activeTab !== "reviews") return;
    let active = true;
    reviewService.getProductReviews(slug).then((result) => { if (active) setReviews(result.data || []); })
      .catch((error) => { if (active) setReviewError(error.message || "Could not load reviews."); })
      .finally(() => { if (active) setReviewsLoading(false); });
    return () => { active = false; };
  }, [activeTab, slug]);

  useEffect(() => {
    let active = true;
    if (!user?.id || !product?.id) return () => { active = false; };
    reviewService.getMyProductReview(product.id).then((review) => {
      if (!active) return;
      setMyReview(review);
      setReviewOwnerId(user.id);
      if (review) setReviewForm({ rating: review.rating, title: review.title, text: review.text });
    }).catch(() => { if (active) { setMyReview(null); setReviewOwnerId(user.id); } });
    return () => { active = false; };
  }, [user?.id, product?.id]);

  const submitReview = async (event) => {
    event.preventDefault();
    if (!user) { setReviewError("Sign in to submit a review."); return; }
    if (reviewOwnerId !== user.id) return;
    setReviewSubmitting(true); setReviewError(""); setReviewMessage("");
    try {
      const result = myReview
        ? await reviewService.updateReview(myReview.id, reviewForm)
        : await reviewService.submitReview({ productId: product.id, ...reviewForm });
      setMyReview({ ...(myReview || {}), ...result.data, ...reviewForm });
      setReviewMessage("Your review was submitted for moderation. It will appear after approval.");
      addToast("Your review was submitted for moderation. It will appear after approval.", "success");
      const [freshProduct, freshReviews] = await Promise.allSettled([productService.getProductBySlug(slug), reviewService.getProductReviews(slug)]);
      if (freshProduct.status === "fulfilled" && freshProduct.value) setProduct(freshProduct.value);
      if (freshReviews.status === "fulfilled") setReviews(freshReviews.value.data || []);
    } catch (error) {
      setReviewError(error.message || "Could not submit review.");
      addToast(error.message || "Could not submit review.", "error");
    }
    finally { setReviewSubmitting(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-stone-500 text-sm">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return notFound();
  }

  const categoryObj = categories.find(c => c.slug === product.category);
  const isSaved = isInWishlist(product.id);
  const images = getProductImages(product);
  const hasMultipleImages = images.length > 1;
  const activeImage = images[selectedImageIndex] || images[0] || "";
  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;
  const availableStock = Math.max(0, Number(product.stock) || 0);

  const handleAddToCart = () => {
    if (availableStock < 1) return;
    setIsAdding(true);
    addToCart(product, quantity);
    setTimeout(() => setIsAdding(false), 800);
  };

  const handleBuyNow = () => {
    if (availableStock < 1) return;
    addToCart(product, quantity);
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
      <CategoryNavigation />
      <MobileNavigation isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Products", href: "/products" },
            { label: categoryObj?.name || product.category, href: `/categories/${product.category}` },
            { label: product.name }
          ]}
        />

        {/* Main Product Showcase Layout */}
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-6 py-6 lg:grid-cols-2 lg:gap-10">

          {/* Left: Image Gallery */}
          <div className="w-full min-w-0">
            <div className="mx-auto flex w-full max-w-[600px] flex-col-reverse gap-3 sm:flex-row sm:items-start lg:mx-0">
              {hasMultipleImages && (
                <div
                  aria-label="Product image thumbnails"
                  className="flex w-full shrink-0 gap-2 overflow-x-auto pb-1 sm:w-20 sm:flex-col sm:overflow-visible sm:pb-0"
                >
                  {images.map((img, index) => (
                    <button
                      key={`${img}-${index}`}
                      type="button"
                      aria-label={`Show image ${index + 1}`}
                      aria-pressed={selectedImageIndex === index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 sm:w-20 ${
                        selectedImageIndex === index
                          ? "border-amber-800 ring-2 ring-amber-500/20"
                          : "border-stone-200 opacity-70 hover:border-stone-400 hover:opacity-100"
                      }`}
                    >
                      <ProductImage
                        src={img}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        sizes="80px"
                        className="object-contain p-0.5"
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="relative min-w-0 flex-1">
                <div className="relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-md">
                  <ProductImage
                    src={activeImage}
                    alt={product.name}
                    preload
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 560px"
                    className="object-contain p-2"
                  />

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                    {discountPercent > 0 && (
                      <span className="px-2.5 py-1 bg-rose-600 text-white text-xs font-extrabold rounded-lg shadow-sm">
                        -{discountPercent}% OFF
                      </span>
                    )}
                    {product.isBestSeller && (
                      <span className="px-2.5 py-1 bg-stone-900 text-amber-300 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">
                        Best Seller
                      </span>
                    )}
                    {product.isNewArrival && (
                      <span className="px-2.5 py-1 bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">
                        New Arrival
                      </span>
                    )}
                  </div>

                  {/* Wishlist Button */}
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product)}
                    className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all z-10 ${
                      isSaved
                        ? "bg-rose-50 text-rose-600 border border-rose-200"
                        : "bg-white/90 text-stone-700 hover:text-rose-600 hover:bg-white"
                    }`}
                    aria-label="Save to wishlist"
                  >
                    <Heart className={`w-5 h-5 ${isSaved ? "fill-rose-600 text-rose-600" : ""}`} />
                  </button>

                  {hasMultipleImages && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length)}
                        aria-label="Previous product image"
                        className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-stone-200 bg-white/90 p-2 text-stone-800 shadow-md transition-colors hover:bg-white hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedImageIndex((selectedImageIndex + 1) % images.length)}
                        aria-label="Next product image"
                        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-stone-200 bg-white/90 p-2 text-stone-800 shadow-md transition-colors hover:bg-white hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {hasMultipleImages && (
                  <p className="mt-2 text-center text-[11px] text-stone-500 sm:text-left">
                    Image {selectedImageIndex + 1} of {images.length}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Product Details & Actions */}
          <div className="flex min-w-0 flex-col space-y-6">
            
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200/60 text-xs font-bold uppercase tracking-wider">
                  {product.brand}
                </span>
                {product.countryOfOrigin && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                    <Globe2 className="w-3.5 h-3.5 text-stone-500" /> Imported from {product.countryOfOrigin}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950 leading-tight">
                {product.name}
              </h1>

              {/* Rating and Reviews */}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-stone-300"}`}
                    />
                  ))}
                  <span className="text-xs font-bold text-stone-800 ml-1">{Number(product.rating || 0).toFixed(1)}</span>
                </div>
                <span className="text-stone-300">|</span>
                <span className="text-xs text-stone-500">
                  {product.reviewCount} approved reviews
                </span>
                <span className="text-stone-300">|</span>
                <span className={`text-xs font-semibold flex items-center gap-1 ${Number(product.stock) > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  <Check className="w-3.5 h-3.5" /> {Number(product.stock) > 0 ? `In Stock (${product.stock} units available)` : "Out of Stock"}
                </span>
              </div>
            </div>

            {/* Pricing Box */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-bold text-stone-950 font-serif">
                  {formatBDT(product.discountPrice || product.price)}
                </span>
                {product.discountPrice && (
                  <span className="text-base text-stone-400 line-through">
                    {formatBDT(product.price)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-xs font-bold">
                    Save {formatBDT(product.price - product.discountPrice)} ({discountPercent}% OFF)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Prices in Bangladeshi Taka (BDT) and calculated from the verified product price.
              </p>
            </div>

            {/* Short Description */}
            <p className="text-sm text-stone-600 leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Size / Weight highlight */}
            {product.size && (
              <div className="text-xs text-stone-700">
                <span className="font-semibold text-stone-900">Pack / Weight:</span>{" "}
                <span className="px-2 py-1 bg-white border border-stone-300 rounded-md font-mono">
                  {product.size}
                </span>
              </div>
            )}

            {/* Category and SKU */}
            <div className="grid grid-cols-1 gap-2 text-xs text-stone-700 sm:grid-cols-2">
              <div>
                <span className="font-semibold text-stone-900">Category:</span>{" "}
                <Link href={`/categories/${product.category}`} className="text-amber-900 hover:underline">
                  {categoryObj?.name || product.category}
                </Link>
              </div>
              <div>
                <span className="font-semibold text-stone-900">SKU:</span>{" "}
                <span className="font-mono">{product.sku || product.id || product.slug}</span>
              </div>
            </div>

            {/* Quantity Selector & Add to Cart / Buy Now */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-stone-700">Quantity:</span>
                <div className="flex items-center border border-stone-300 rounded-xl bg-white shadow-xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2.5 text-stone-600 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-xs font-bold text-stone-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(1, Math.min(availableStock, current + 1)))}
                    disabled={quantity >= availableStock}
                    className="p-2.5 text-stone-600 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAdding || availableStock < 1}
                  className={`py-3.5 px-6 rounded-full font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                    availableStock < 1
                      ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                      : isAdding
                        ? "bg-emerald-600 text-white"
                        : "bg-stone-900 text-white hover:bg-stone-800 active:scale-95"
                  }`}
                >
                  {availableStock < 1 ? (
                    <>
                      <ShoppingBag className="w-4 h-4" /> Out of Stock
                    </>
                  ) : isAdding ? (
                    <>
                      <Check className="w-4 h-4" /> Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-amber-300" /> Add to Shopping Cart
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={availableStock < 1}
                  className="py-3.5 px-6 rounded-full font-semibold text-xs sm:text-sm bg-amber-600 hover:bg-amber-500 text-stone-950 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500"
                >
                  <Zap className="w-4 h-4 fill-stone-950" /> Instant Checkout
                </button>
              </div>
            </div>

            {/* Delivery & Trust Highlights */}
            <div className="pt-4 border-t border-stone-200 grid grid-cols-2 gap-3 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Dhaka (24-48h) • Outside Dhaka (2-4d)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Cash on Delivery Available</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-blue-700 shrink-0" />
                <span>7-Day Return / Replacement</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
                <span>100% Genuine Direct Import</span>
              </div>
            </div>

          </div>

        </div>

        {/* Detailed Tabs: Description, Specs, Shipping, Reviews */}
        <div className="mt-12 bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
          {/* Tab buttons */}
          <div className="flex border-b border-stone-200 overflow-x-auto">
            {[
              { id: "description", label: "Product Description" },
              { id: "specs", label: "Specifications & Origin" },
              { id: "shipping", label: "Delivery & Returns" },
              { id: "reviews", label: `Reviews (${product.reviewCount})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { if (tab.id === "reviews") { setReviewsLoading(true); setReviewError(""); } setActiveTab(tab.id); }}
                className={`px-6 py-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-amber-800 text-amber-900 bg-amber-50/40"
                    : "border-transparent text-stone-500 hover:text-stone-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab contents */}
          <div className="p-6 sm:p-8 text-stone-700 text-sm leading-relaxed">
            {activeTab === "description" && (
              <div className="space-y-4 max-w-3xl">
                <h3 className="font-serif font-bold text-lg text-stone-950">About {product.name}</h3>
                <p>{product.fullDescription}</p>
                <p className="text-xs text-stone-500 bg-stone-50 p-3 rounded-xl border border-stone-200">
                  Note: All imported consumables are stored in climate-controlled warehousing in Dhaka to preserve optimal freshness, crunch, and authentic flavor integrity.
                </p>
              </div>
            )}

            {activeTab === "specs" && (
              <div className="max-w-2xl">
                <h3 className="font-serif font-bold text-lg text-stone-950 mb-4">Product Specifications</h3>
                <div className="divide-y divide-stone-200 border border-stone-200 rounded-2xl overflow-hidden">
                  <div className="flex justify-between p-3.5 bg-stone-50 text-xs font-semibold">
                    <span>Attribute</span>
                    <span>Details</span>
                  </div>
                  <div className="flex justify-between p-3.5 text-xs">
                    <span className="text-stone-500">Brand</span>
                    <span className="font-semibold text-stone-900">{product.brand}</span>
                  </div>
                  <div className="flex justify-between p-3.5 text-xs">
                    <span className="text-stone-500">Country of Origin</span>
                    <span className="font-semibold text-stone-900">{product.countryOfOrigin}</span>
                  </div>
                  <div className="flex justify-between p-3.5 text-xs">
                    <span className="text-stone-500">Category</span>
                    <span className="font-semibold text-stone-900">{categoryObj?.name || product.category}</span>
                  </div>
                  <div className="flex justify-between p-3.5 text-xs">
                    <span className="text-stone-500">Subcategory</span>
                    <span className="font-semibold text-stone-900">{product.subcategory}</span>
                  </div>
                  {product.specifications &&
                    Object.entries(product.specifications).map(([key, val]) => (
                      <div key={key} className="flex justify-between p-3.5 text-xs">
                        <span className="text-stone-500">{key}</span>
                        <span className="font-semibold text-stone-900">{val}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="space-y-4 max-w-2xl text-xs sm:text-sm">
                <h3 className="font-serif font-bold text-lg text-stone-950">Shipping & Delivery Rates</h3>
                <ul className="space-y-2 list-disc pl-5 text-stone-600">
                  <li><strong>Inside Dhaka:</strong> ৳120 regular delivery charge (Delivered in 24-48 hours).</li>
                  <li><strong>Outside Dhaka (All 64 Districts):</strong> ৳180 regular delivery charge (Delivered in 2-4 days).</li>
                  <li><strong>Free Delivery:</strong> Orders exceeding <strong>৳3,000</strong> receive 100% free nationwide delivery!</li>
                  <li><strong>Cash on Delivery:</strong> Available for all locations. Please check parcels upon delivery before receiving.</li>
                </ul>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6 max-w-3xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-lg text-stone-950">Customer Reviews</h3>
                  <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-semibold">
                    {product.reviewCount} approved reviews · {Number(product.rating || 0).toFixed(1)} / 5.0
                  </span>
                </div>

                {reviewError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{reviewError}</p>}
                {reviewMessage && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{reviewMessage}</p>}
                {reviewsLoading ? <p role="status" className="text-sm text-stone-500">Loading reviews…</p> : reviews.length ? <div className="space-y-3">{reviews.map((review) => <article key={review.id} className="rounded-xl border border-stone-200 p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="font-semibold text-stone-900">{review.title}</h4><p className="text-xs text-stone-500">{review.userName} · {new Date(review.createdAt).toLocaleDateString()}</p></div><span className="text-amber-700">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div><p className="mt-2 text-sm text-stone-700">{review.text}</p></article>)}</div> : <p className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">No approved reviews yet.</p>}
                {!isLoaded ? <p role="status" className="text-sm text-stone-500">Checking your account…</p> : user && reviewOwnerId !== user.id ? <p role="status" className="text-sm text-stone-500">Loading your review…</p> : user ? <form onSubmit={submitReview} className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <h4 className="font-semibold text-stone-900">{myReview ? "Edit your review" : "Write a review"}</h4>
                  {myReview && <p className="text-xs capitalize text-stone-500">Current status: {myReview.status}; saving sends it for moderation again.</p>}
                  <label className="block text-xs font-semibold">Rating<select required value={reviewForm.rating} onChange={(event) => setReviewForm((current) => ({ ...current, rating: Number(event.target.value) }))} className="mt-1 block rounded-lg border border-stone-300 bg-white p-2">{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}</select></label>
                  <label className="block text-xs font-semibold">Title<input required minLength={2} maxLength={120} value={reviewForm.title} onChange={(event) => setReviewForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2"/></label>
                  <label className="block text-xs font-semibold">Review<textarea required minLength={10} maxLength={2000} rows={4} value={reviewForm.text} onChange={(event) => setReviewForm((current) => ({ ...current, text: event.target.value }))} className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2"/></label>
                  <p className="text-xs text-stone-500">Reviews are moderated before publication. Purchase verification is not currently used.</p>
                  <button disabled={reviewSubmitting} className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{reviewSubmitting ? "Submitting…" : myReview ? "Save review" : "Submit review"}</button>
                </form> : <p className="text-sm text-stone-600"><Link href="/login" className="text-amber-900 underline">Sign in</Link> to submit a review.</p>}
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-amber-800">
                  Recommended For You
                </span>
                <h2 className="text-2xl font-serif font-bold text-stone-950 mt-0.5">
                  Related Imported Items
                </h2>
              </div>
              <Link
                href={`/categories/${product.category}`}
                className="text-xs font-semibold text-amber-900 hover:underline"
              >
                View Category →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}

      </main>

      <SiteFooter />
    </div>
  );
}
