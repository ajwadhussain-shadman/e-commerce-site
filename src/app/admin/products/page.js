"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { productService } from "@/services/productService";
import { categories } from "@/data/categories";
import { useToast } from "@/context/ToastContext";
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  ExternalLink, 
  RotateCcw,
  Star,
  CheckCircle2,
  Tag
} from "lucide-react";

export default function AdminProductsPage() {
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadProducts = async () => {
    setIsLoading(true);
    const data = await productService.getAllProducts();
    setProducts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id, name) => {
    if (confirm(`Are you sure you want to remove "${name}" from demo inventory?`)) {
      await productService.deleteProduct(id);
      addToast(`Deleted "${name}"`, "info");
      loadProducts();
    }
  };

  const handleReset = async () => {
    if (confirm("Reset inventory back to initial default 34 products?")) {
      await productService.resetToDefaults();
      addToast("Inventory restored to defaults", "success");
      loadProducts();
    }
  };

  const filtered = products.filter(p => {
    const matchesSearch = !search || 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !selectedCat || p.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-950">
            Product Management
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage your imported SKUs, prices, stock levels, and storefront visibility.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl border border-stone-300 transition-colors flex items-center gap-1.5"
            title="Reset to default mock data"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Default SKUs
          </button>
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 text-stone-900 placeholder-stone-400 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:border-amber-700"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-stone-50 text-stone-800 text-xs font-medium rounded-xl border border-stone-300 focus:outline-hidden"
          >
            <option value="">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Origin</th>
                <th className="py-3 px-4">Price (BDT)</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Badges</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((prod) => (
                <tr key={prod.id} className="hover:bg-stone-50/70 transition-colors">
                  
                  {/* Item Image and Title */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                        <Image
                          src={prod.images[0]}
                          alt={prod.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 max-w-xs">
                        <span className="font-semibold text-stone-900 block truncate">
                          {prod.name}
                        </span>
                        <span className="text-[11px] text-amber-900 font-medium">
                          {prod.brand}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 text-stone-600">
                    <span className="block font-medium text-stone-900">
                      {categories.find(c => c.slug === prod.category)?.name || prod.category}
                    </span>
                    <span className="text-[10px] text-stone-400">{prod.subcategory}</span>
                  </td>

                  {/* Origin */}
                  <td className="py-3 px-4 text-stone-600 font-medium">
                    {prod.countryOfOrigin || "Imported"}
                  </td>

                  {/* Price */}
                  <td className="py-3 px-4 font-mono">
                    <span className="font-bold text-stone-950">
                      ৳{prod.discountPrice || prod.price}
                    </span>
                    {prod.discountPrice && (
                      <span className="block text-[10px] text-stone-400 line-through">
                        ৳{prod.price}
                      </span>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      prod.stock < 15
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {prod.stock} units
                    </span>
                  </td>

                  {/* Badges */}
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {prod.isFeatured && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded text-[9px] font-bold">
                          Featured
                        </span>
                      )}
                      {prod.isBestSeller && (
                        <span className="px-1.5 py-0.5 bg-stone-800 text-amber-300 rounded text-[9px] font-bold">
                          Best Seller
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/products/${prod.slug}`}
                        target="_blank"
                        className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                        title="View on Storefront"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(prod.id, prod.name)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete SKU"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
