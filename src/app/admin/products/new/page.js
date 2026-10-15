"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { productService } from "@/services/productService";
import { categories } from "@/data/categories";
import { useToast } from "@/context/ToastContext";
import { ArrowLeft, Save, Sparkles, Image as ImageIcon } from "lucide-react";

export default function AdminNewProductPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "chocolates-snacks",
    subcategory: "KitKat & Chocolate Bars",
    price: "",
    discountPrice: "",
    stock: "25",
    size: "Standard Pack",
    countryOfOrigin: "Japan",
    shortDescription: "",
    fullDescription: "",
    imageUrl: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80",
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      alert("Please provide product name and price");
      return;
    }

    setIsSubmitting(true);
    try {
      const newProduct = {
        name: formData.name,
        brand: formData.brand || "Imported Brand",
        category: formData.category,
        subcategory: formData.subcategory,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
        stock: Number(formData.stock) || 20,
        size: formData.size,
        countryOfOrigin: formData.countryOfOrigin,
        shortDescription: formData.shortDescription || `${formData.name} imported from ${formData.countryOfOrigin}.`,
        fullDescription: formData.fullDescription || `Authentic premium imported ${formData.name}. Fresh stock directly imported and stored in climate-controlled warehousing in Dhaka.`,
        images: [formData.imageUrl],
        rating: 4.8,
        reviewCount: 1,
        isFeatured: formData.isFeatured,
        isNewArrival: formData.isNewArrival,
        isBestSeller: formData.isBestSeller,
        specifications: {
          "Origin": formData.countryOfOrigin,
          "Package Type": formData.size,
          "Storage": "Climate controlled cool dry place"
        }
      };

      await productService.createProduct(newProduct);
      addToast(`Added "${newProduct.name}" to inventory!`, "success");
      router.push("/admin/products");
    } catch (err) {
      console.error(err);
      alert("Error adding product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategoryObj = categories.find(c => c.slug === formData.category);

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
              Brand / Manufacturer
            </label>
            <input
              type="text"
              placeholder="e.g. Nestle Japan / Samyang / Quaker"
              value={formData.brand}
              onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
            />
          </div>
        </div>

        {/* Row 2: Category and Subcategory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              Main Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => {
                const catSlug = e.target.value;
                const cat = categories.find(c => c.slug === catSlug);
                setFormData(prev => ({
                  ...prev,
                  category: catSlug,
                  subcategory: cat?.subcategories[0] || ""
                }));
              }}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              Subcategory
            </label>
            <select
              value={formData.subcategory}
              onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
            >
              {selectedCategoryObj?.subcategories.map((sub, i) => (
                <option key={i} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
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

        {/* Row 5: Image URL */}
        <div>
          <label className="font-semibold text-stone-700 block mb-1">
            Product Image URL (High resolution image asset)
          </label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
            className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-hidden focus:border-amber-700"
          />
        </div>

        {/* Descriptions */}
        <div>
          <label className="font-semibold text-stone-700 block mb-1">
            Short Description
          </label>
          <input
            type="text"
            placeholder="Brief 1-sentence product summary"
            value={formData.shortDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
            className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
          />
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-6 pt-2">
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
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? "Saving SKU..." : "Save Product SKU"}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
