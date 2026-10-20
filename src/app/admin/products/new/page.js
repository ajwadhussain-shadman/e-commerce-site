"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { categoryService, productService } from "@/services/productService";
import { useToast } from "@/context/ToastContext";
import ProductImageManager from "@/components/admin/ProductImageManager";
import { ArrowLeft, Save } from "lucide-react";

export default function AdminNewProductPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    brand: "",
    category: "",
    subcategory: "",
    price: "",
    discountPrice: "",
    stock: "0",
    size: "",
    countryOfOrigin: "",
    shortDescription: "",
    fullDescription: "",
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    isActive: true,
  });
  const [imageItems, setImageItems] = useState([]);
  const [imagesUploading, setImagesUploading] = useState(false);

  useEffect(() => {
    let active = true;
    categoryService.getCategories().then((data) => {
      if (!active) return;
      setCategories(Array.isArray(data) ? data : []);
    }).catch((error) => { if (active) setCategoryError(error.message || "Could not load categories."); })
      .finally(() => { if (active) setCategoryLoading(false); });
    return () => { active = false; };
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (imagesUploading) {
      addToast("Wait for the image upload to finish before saving.", "error");
      return;
    }
    if (isSubmitting) return;
    const missingFields = [
      ["Product title", formData.name],
      ["Brand / manufacturer", formData.brand],
      ["Main category", formData.category],
      ["Subcategory", formData.subcategory],
      ["Regular price", formData.price],
      ["Short description", formData.shortDescription],
      ["Full description", formData.fullDescription],
    ].filter(([, value]) => !String(value || "").trim()).map(([label]) => label);
    if (missingFields.length) {
      addToast(`Complete these required fields: ${missingFields.join(", ")}.`, "error");
      return;
    }
    const images = imageItems.map((item) => item.url).filter(Boolean);
    if (!images.length) {
      addToast("Select at least one valid product image before saving.", "error");
      return;
    }
    if (formData.discountPrice && Number(formData.discountPrice) > Number(formData.price)) {
      addToast("Sale price cannot be higher than the regular price.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const newProduct = {
        name: formData.name,
        ...(formData.slug.trim() ? { slug: formData.slug.trim() } : {}),
        brand: formData.brand,
        category: formData.category,
        subcategory: formData.subcategory,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
        stock: Number(formData.stock),
        size: formData.size,
        countryOfOrigin: formData.countryOfOrigin,
        shortDescription: formData.shortDescription,
        fullDescription: formData.fullDescription,
        images,
        imageAssets: imageItems.filter((item) => item.publicId).map((item) => ({ publicId: item.publicId, url: item.url })),
        isFeatured: formData.isFeatured,
        isNewArrival: formData.isNewArrival,
        isBestSeller: formData.isBestSeller,
        isActive: formData.isActive,
        specifications: Object.fromEntries([...(formData.countryOfOrigin ? [["Origin", formData.countryOfOrigin]] : []), ...(formData.size ? [["Package Type", formData.size]] : [])]),
      };

      await productService.createProduct(newProduct);
      addToast(`Added "${newProduct.name}" to inventory!`, "success");
      router.push("/admin/products");
    } catch (err) {
      addToast(err.message || "Could not add product", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategoryObj = categories.find(c => c.slug === formData.category);
  const selectedSubcategories = Array.isArray(selectedCategoryObj?.subcategories)
    ? selectedCategoryObj.subcategories.filter((subcategory) => typeof subcategory === "string" && subcategory.trim())
    : [];

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="p-2 bg-white rounded-xl border border-stone-200 text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-950">
            Add New Imported Product
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Register a new SKU into the store catalog with pricing and imported specifications.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs space-y-6 text-xs">
        {categoryError && <p role="alert" className="text-rose-700">Could not load categories: {categoryError}</p>}
        
        {/* Row 1: Name and Brand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              Product Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. KitKat Japanese Strawberry Mini Bars"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              Brand / Manufacturer *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Nestle Japan / Samyang / Quaker"
              value={formData.brand}
              onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
            />
          </div>
        </div>

        <label className="block font-semibold text-stone-700">Slug (optional; generated from product name)<input value={formData.slug} onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))} className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 p-2.5" /></label>

        {/* Row 2: Category and Subcategory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              Main Category *
            </label>
            <select
              required
              disabled={categoryLoading || Boolean(categoryError) || categories.length === 0}
              value={formData.category}
              onChange={(e) => {
                const catSlug = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  category: catSlug,
                  subcategory: ""
                }));
              }}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
            >
              <option value="">{categoryLoading ? "Loading categories…" : categories.length ? "Choose a category" : "No categories available"}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              Subcategory *
            </label>
            <select
              required
              disabled={!formData.category || selectedSubcategories.length === 0}
              value={formData.subcategory}
              onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
            >
              <option value="">{!formData.category ? "Choose a category first" : selectedSubcategories.length ? "Choose a subcategory" : "No subcategories configured"}</option>
              {selectedSubcategories.map((sub, i) => (
                <option key={i} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
            {formData.category && !categoryLoading && selectedSubcategories.length === 0 && (
              <p className="mt-1 text-[10px] text-stone-500">Add subcategories for this category in <Link href="/admin/categories" className="font-semibold text-amber-900 underline">Category management</Link>.</p>
            )}
          </div>
        </div>

        {/* Row 3: Pricing and Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              Regular Price (BDT ৳) *
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              inputMode="decimal"
              placeholder="e.g. 850"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-hidden focus:border-amber-700"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              Discount Price (BDT ৳, Optional)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              placeholder="e.g. 720"
              value={formData.discountPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, discountPrice: e.target.value }))}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-hidden focus:border-amber-700"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              Warehouse Stock (Units)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.stock}
              onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-hidden focus:border-amber-700"
            />
          </div>
        </div>

        {/* Row 4: Origin & Size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              Country of Origin
            </label>
            <input
              type="text"
              placeholder="e.g. Japan / United Kingdom / South Korea"
              value={formData.countryOfOrigin}
              onChange={(e) => setFormData(prev => ({ ...prev, countryOfOrigin: e.target.value }))}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              Weight / Pack Size
            </label>
            <input
              type="text"
              placeholder="e.g. 12 Mini Packs (140g) / 500g Tub"
              value={formData.size}
              onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
            />
          </div>
        </div>

        {/* Product images */}
        <ProductImageManager
          items={imageItems}
          onChange={setImageItems}
          onBusyChange={setImagesUploading}
          disabled={isSubmitting}
        />

        {/* Descriptions */}
        <div>
          <label className="font-semibold text-stone-700 block mb-1">
            Short Description
          </label>
          <input
            type="text"
            required
            placeholder="Brief 1-sentence product summary"
            value={formData.shortDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
            className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
          />
        </div>

        <label className="block font-semibold text-stone-700">Full description<textarea required rows={4} value={formData.fullDescription} onChange={(e) => setFormData((current) => ({ ...current, fullDescription: e.target.value }))} className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 p-2.5" /></label>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))} /><span className="font-semibold text-stone-800">Active in storefront</span></label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
              className="rounded text-amber-700 focus:ring-amber-500"
            />
            <span className="font-semibold text-stone-800">Featured on Homepage</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isNewArrival}
              onChange={(e) => setFormData(prev => ({ ...prev, isNewArrival: e.target.checked }))}
              className="rounded text-amber-700 focus:ring-amber-500"
            />
            <span className="font-semibold text-stone-800">New Arrival Badge</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isBestSeller}
              onChange={(e) => setFormData(prev => ({ ...prev, isBestSeller: e.target.checked }))}
              className="rounded text-amber-700 focus:ring-amber-500"
            />
            <span className="font-semibold text-stone-800">Best Seller Tag</span>
          </label>
        </div>

        <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 border border-stone-300 rounded-xl text-stone-700 font-semibold hover:bg-stone-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || imagesUploading}
            className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{imagesUploading ? "Uploading images..." : isSubmitting ? "Saving SKU..." : "Save Product SKU"}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
