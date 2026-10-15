"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, notFound } from "next/navigation";
import SiteHeader from "@/components/common/SiteHeader";
import CategoryNavigation from "@/components/common/CategoryNavigation";
import MobileNavigation from "@/components/common/MobileNavigation";
import SiteFooter from "@/components/common/SiteFooter";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import ProductCard from "@/components/products/ProductCard";
import { productService } from "@/services/productService";
import { categories } from "@/data/categories";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
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
  Globe2
} from "lucide-react";

export default function ProductDetailPage({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description"); // "description", "specs", "shipping", "reviews"
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center text-stone-500 text-sm">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return notFound();
  }

  const categoryObj = categories.find(c => c.slug === product.category);
  const isSaved = isInWishlist(product.id);
  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product, quantity);
    setTimeout(() => setIsAdding(false), 800);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf9]">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 py-6 items-start">
          
          {/* Left: Image Gallery */}
          <div className="lg:col-span-6 space-y-4">
            {/* Primary Main Image */}
            <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-white border border-stone-200/90 shadow-md">
              <Image
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
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
            </div>

            {/* Thumbnail Navigation */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-3">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? "border-amber-800 ring-2 ring-amber-500/20"
                        : "border-stone-200 hover:border-stone-400 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details & Actions */}
          <div className="lg:col-span-6 flex flex-col space-y-6">
            
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
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-stone-300"}`}
                    />
                  ))}
                  <span className="text-xs font-bold text-stone-800 ml-1">{product.rating}</span>
                </div>
                <span className="text-stone-300">|</span>
                <span className="text-xs text-stone-500">
                  {product.reviewCount} customer reviews (Demo)
                </span>
                <span className="text-stone-300">|</span>
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> In Stock ({product.stock} units available)
                </span>
              </div>
            </div>

            {/* Pricing Box */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-stone-950 font-serif">
                  ৳{product.discountPrice || product.price}
                </span>
                {product.discountPrice && (
                  <span className="text-base text-stone-400 line-through">
                    ৳{product.price}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-xs font-bold">
                    Save ৳{product.price - product.discountPrice} ({discountPercent}% OFF)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Prices in Bangladeshi Taka (BDT). Includes all applicable demo import customs tariffs.
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

            {/* Quantity Selector & Add to Cart / Buy Now */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-stone-700">Quantity:</span>
                <div className="flex items-center border border-stone-300 rounded-xl bg-white shadow-xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 text-stone-600 hover:text-stone-950"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-xs font-bold text-stone-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2.5 text-stone-600 hover:text-stone-950"
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
                  disabled={isAdding}
                  className={`py-3.5 px-6 rounded-full font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                    isAdding
                      ? "bg-emerald-600 text-white"
                      : "bg-stone-900 text-white hover:bg-stone-800 active:scale-95"
                  }`}
                >
                  {isAdding ? (
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
                  className="py-3.5 px-6 rounded-full font-semibold text-xs sm:text-sm bg-amber-600 hover:bg-amber-500 text-stone-950 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
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
                onClick={() => setActiveTab(tab.id)}
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
                  <h3 className="font-serif font-bold text-lg text-stone-950">Verified Customer Reviews (Demo)</h3>
                  <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-semibold">
                    Average: {product.rating} / 5.0
                  </span>
                </div>

                {/* Sample reviews */}
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-stone-900">Samiul Haque • Banani, Dhaka</span>
                      <span className="text-stone-400">2 days ago</span>
                    </div>
                    <div className="flex items-center text-amber-400 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-stone-600">
                      &ldquo;100% genuine imported packaging! The taste is exactly what I used to have abroad. Delivery inside Dhaka took less than 24 hours.&rdquo;
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-stone-900">Sabrina Mehjabin • Dhanmondi</span>
                      <span className="text-stone-400">1 week ago</span>
                    </div>
                    <div className="flex items-center text-amber-400 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-stone-600">
                      &ldquo;Super crisp condition, arrived with ice gel pack to prevent chocolate melting in Dhaka heat. Very impressed!&rdquo;
                    </p>
                  </div>
                </div>
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
