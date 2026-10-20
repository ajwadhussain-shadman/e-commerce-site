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
        <label className="text-xs font-semibold">Price (BDT)<input required type="number" min="0.01" step="0.01" value={product.price ?? ""} onChange={(e) => update("price", e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 p-2.5" /></label>
        <label className="text-xs font-semibold">Sale price (optional)<input type="number" min="0.01" step="0.01" value={product.discountPrice ?? ""} onChange={(e) => update("discountPrice", e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 p-2.5" /></label>
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
