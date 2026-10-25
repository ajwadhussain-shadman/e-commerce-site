"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { categoryService, productService } from "@/services/productService";
import { useToast } from "@/context/ToastContext";
import ProductImageManager from "@/components/admin/ProductImageManager";
import { getProductImages } from "@/lib/product-images.mjs";
import { ArrowLeft, Save } from "lucide-react";

export default function EditProductPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageItems, setImageItems] = useState([]);
  const [imagesUploading, setImagesUploading] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([productService.getAdminProduct(id), categoryService.getCategories()])
      .then(([record, categoryList]) => {
        if (!active) return;
        const assetByUrl = new Map((record.imageAssets || []).map((asset) => [asset.url, asset.publicId]));
        setImageItems(getProductImages(record).map((url) => ({ url, publicId: assetByUrl.get(url) || null })));
        setProduct(record);
        setCategories(categoryList);
      })
      .catch((loadError) => { if (active) setError(loadError.message || "Could not load product."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const update = (field, value) => setProduct((current) => ({ ...current, [field]: value }));

  const handlePriceChange = (val) => {
    setProduct((current) => {
      const next = { ...current, price: val };
      if (val && current.discountPercentage) {
        const pct = Number(current.discountPercentage);
        if (pct > 0 && pct <= 100) {
          next.discountPrice = String(Math.round(Number(val) * (1 - pct / 100)));
        }
      }
      return next;
    });
  };

  const handlePercentageChange = (pctVal) => {
    setProduct((current) => {
      const pct = Number(pctVal);
      const next = { ...current, discountPercentage: pctVal };
      if (!Number.isNaN(pct) && pct > 0 && pct <= 100) {
        if (current.price) {
          next.discountPrice = String(Math.round(Number(current.price) * (1 - pct / 100)));
        }
        if (!current.discountTag || current.discountTag.endsWith("% OFF")) {
          next.discountTag = `${pct}% OFF`;
        }
      } else if (!pctVal) {
        next.discountPrice = "";
        next.discountTag = "";
      }
      return next;
    });
  };

  const handleDiscountPriceChange = (discVal) => {
    setProduct((current) => {
      const next = { ...current, discountPrice: discVal };
      const disc = Number(discVal);
      const price = Number(current.price);
      if (price > 0 && disc > 0 && disc < price) {
        const pct = Math.round(((price - disc) / price) * 100);
        next.discountPercentage = String(pct);
        if (!current.discountTag || current.discountTag.endsWith("% OFF")) {
          next.discountTag = `${pct}% OFF`;
        }
      } else if (!discVal) {
        next.discountPercentage = "";
        next.discountTag = "";
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!product) return;
    if (saving) return;
    if (imagesUploading) {
      const msg = "Wait for the image upload to finish before saving.";
      setError(msg);
      addToast(msg, "error");
      return;
    }
    const images = imageItems.map((item) => item.url).filter(Boolean);
    if (!images.length) {
      const msg = "Select at least one valid product image before saving.";
      setError(msg);
      addToast(msg, "error");
      return;
    }
    if (product.discountPrice !== "" && product.discountPrice !== null && product.discountPrice !== undefined && Number(product.discountPrice) > Number(product.price)) {
      const msg = "Sale price cannot be higher than the regular price.";
      setError(msg);
      addToast(msg, "error");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await productService.updateProduct(id, {
        ...product,
        price: Number(product.price),
        discountPrice: product.discountPrice === "" || product.discountPrice === null || product.discountPrice === undefined ? null : Number(product.discountPrice),
        discountPercentage: product.discountPercentage === "" || product.discountPercentage === null || product.discountPercentage === undefined ? null : Number(product.discountPercentage),
        discountTag: product.discountTag ? String(product.discountTag).trim() : null,
        stock: Number(product.stock),
        images,
        imageAssets: imageItems.filter((item) => item.publicId).map((item) => ({ publicId: item.publicId, url: item.url })),
      });
      addToast("Product changes saved.", "success");
      router.push("/admin/products");
    } catch (saveError) {
      const msg = saveError.message || "Could not save product.";
      setError(msg);
      addToast(msg, "error");
    } finally { setSaving(false); }
  };

  if (loading) return <p role="status" className="p-8 text-sm text-stone-500">Loading product...</p>;
  if (!product) return <div className="space-y-4"><p role="alert" className="text-sm text-rose-700">{error || "Product not found."}</p><Link href="/admin/products" className="text-sm text-amber-900 underline">Return to products</Link></div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" aria-label="Back to products" className="rounded-xl border border-stone-200 bg-white p-2"><ArrowLeft className="h-4 w-4" /></Link>
        <div><h1 className="text-2xl font-serif font-bold text-stone-950">Edit Product</h1><p className="text-xs text-stone-500">Changes are saved to the live catalog.</p></div>
      </div>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-stone-200 bg-white p-6 sm:grid-cols-2 sm:p-8">
        <label className="text-xs font-semibold">Name<input required value={product.name || ""} onChange={(e) => update("name", e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 p-2.5" /></label>
        <label className="text-xs font-semibold">Slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={product.slug || ""} onChange={(e) => update("slug", e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 p-2.5" /></label>
        <label className="text-xs font-semibold">Brand<input required value={product.brand || ""} onChange={(e) => update("brand", e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 p-2.5" /></label>
        <label className="text-xs font-semibold">Category<select required value={product.category || ""} onChange={(e) => { const category = categories.find((item) => item.slug === e.target.value); update("category", e.target.value); update("subcategory", category?.subcategories?.[0] || ""); }} className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 p-2.5">{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
        <label className="text-xs font-semibold">Subcategory<input required value={product.subcategory || ""} onChange={(e) => update("subcategory", e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 p-2.5" /></label>
        
        <div className="sm:col-span-2 p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-900 text-xs">Pricing & Discount Tags</span>
            {product.discountTag && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[11px] shadow-xs">
                Badge: {product.discountTag}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-xs font-semibold">
              Regular Price (BDT ৳) *
              <input required type="number" min="0.01" step="0.01" value={product.price ?? ""} onChange={(e) => handlePriceChange(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-2.5 font-mono" />
            </label>
            <label className="text-xs font-semibold">
              Discount Rate (% off)
              <div className="relative mt-1">
                <input type="number" min="0" max="100" step="1" placeholder="e.g. 12" value={product.discountPercentage ?? ""} onChange={(e) => handlePercentageChange(e.target.value)} className="w-full rounded-xl border border-stone-300 bg-white p-2.5 pr-8 font-mono" />
                <span className="absolute right-3 top-2.5 text-stone-400 font-bold">%</span>
              </div>
            </label>
            <label className="text-xs font-semibold">
              Sale Price (BDT ৳)
              <input type="number" min="0.01" step="0.01" value={product.discountPrice ?? ""} onChange={(e) => handleDiscountPriceChange(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-2.5 font-mono" />
            </label>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold">Discount Tag (e.g. &quot;12% OFF&quot;)</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-stone-500 font-medium">Presets:</span>
                {[10, 12, 15, 20, 25].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentageChange(String(pct))}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      String(product.discountPercentage) === String(pct)
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-stone-700 border-stone-300 hover:border-stone-400"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
            <input placeholder="e.g. 12% OFF or Clearance Deal" value={product.discountTag ?? ""} onChange={(e) => update("discountTag", e.target.value)} className="w-full rounded-xl border border-stone-300 bg-white p-2.5 text-xs" />
          </div>
        </div>
        <label className="text-xs font-semibold">Stock<input required type="number" min="0" step="1" value={product.stock ?? 0} onChange={(e) => update("stock", e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 p-2.5" /></label>
        <label className="text-xs font-semibold">Country of origin<input value={product.countryOfOrigin || ""} onChange={(e) => update("countryOfOrigin", e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 p-2.5" /></label>
        <div className="sm:col-span-2">
          <ProductImageManager
            items={imageItems}
            onChange={setImageItems}
            onBusyChange={setImagesUploading}
            disabled={saving}
          />
        </div>
        <label className="text-xs font-semibold sm:col-span-2">Short description<input required value={product.shortDescription || ""} onChange={(e) => update("shortDescription", e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 p-2.5" /></label>
        <label className="text-xs font-semibold sm:col-span-2">Full description<textarea required rows={5} value={product.fullDescription || ""} onChange={(e) => update("fullDescription", e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 p-2.5" /></label>
        <label className="flex items-center gap-2 text-xs font-semibold sm:col-span-2"><input type="checkbox" checked={product.isActive !== false} onChange={(e) => update("isActive", e.target.checked)} />Visible in the storefront</label>
        <div className="flex justify-end gap-3 sm:col-span-2"><Link href="/admin/products" className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-semibold">Cancel</Link><button disabled={saving || imagesUploading} className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" />{imagesUploading ? "Uploading images..." : saving ? "Saving..." : "Save changes"}</button></div>
      </form>
    </div>
  );
}
