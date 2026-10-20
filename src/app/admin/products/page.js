"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, Edit, Eye, EyeOff, Trash2, CheckSquare, Square } from "lucide-react";
import { productService, categoryService } from "@/services/productService";
import { useToast } from "@/context/ToastContext";
import ProductImage from "@/components/products/ProductImage";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { formatBDT } from "@/lib/currency.mjs";
import { getPrimaryImage } from "@/lib/product-images.mjs";

export default function AdminProductsPage() {
  const { addToast } = useToast();
  const [pageData, setPageData] = useState({ data: [], total: 0, page: 1, limit: 20 });
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productToDelete, setProductToDelete] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const [result, cats] = await Promise.all([
        productService.getAdminProductPage({ page, limit: 20, search, category, status, sort }),
        categoryService.getCategories(),
      ]);
      setPageData(result);
      setCategories(cats);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Could not load products.");
      addToast(loadError.message || "Could not load products.", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, category, status, sort, addToast]);

  useEffect(() => {
    let active = true;
    Promise.all([
      productService.getAdminProductPage({ page, limit: 20, search, category, status, sort }),
      categoryService.getCategories(),
    ])
      .then(([result, cats]) => {
        if (active) {
          setPageData(result);
          setCategories(cats);
          setError("");
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Could not load products.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, search, category, status, sort]);

  const toggleActive = async (product) => {
    try {
      await productService.updateProduct(product.id, { ...product, isActive: product.isActive === false });
      addToast(product.isActive === false ? "Product activated." : "Product deactivated.", "success");
      setLoading(true);
      await load();
    } catch (actionError) {
      addToast(actionError.message || "Could not update product.", "error");
    }
  };

  const handleConfirmSingleDelete = async () => {
    if (!productToDelete) return;
    try {
      const result = await productService.deleteProduct(productToDelete.id);
      addToast(
        result.archived ? "Product archived to preserve order history." : "Product removed from catalog.",
        "success"
      );
      setProductToDelete(null);
      setLoading(true);
      await load();
    } catch (actionError) {
      const errorMsg = actionError.message || "Could not remove product.";
      addToast(errorMsg, "error");
      throw actionError;
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pageData.data.length && pageData.data.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageData.data.map((p) => p.id)));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmBulkDelete = async () => {
    if (!selectedIds.size) return;
    const ids = Array.from(selectedIds);
    let successCount = 0;
    let failCount = 0;

    const results = await Promise.allSettled(
      ids.map((id) => productService.deleteProduct(id))
    );

    for (const res of results) {
      if (res.status === "fulfilled") successCount++;
      else failCount++;
    }

    if (successCount > 0) {
      addToast(`Removed or archived ${successCount} product(s).`, "success");
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
      setLoading(true);
      await load();
    }

    if (failCount > 0) {
      const msg = `Failed to remove ${failCount} product(s).`;
      addToast(msg, "error");
      if (successCount === 0) {
        throw new Error(msg);
      }
    }
  };

  const totalPages = Math.max(1, Math.ceil(pageData.total / pageData.limit));
  const allOnPageSelected = pageData.data.length > 0 && selectedIds.size === pageData.data.length;

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold">Product management</h1>
          <p className="mt-1 text-xs text-stone-500">Search, filter, update and archive catalog products.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add product
        </Link>
      </header>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-stone-900 p-4 text-white shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white font-bold text-[10px]">
              {selectedIds.size}
            </span>
            <span>products selected on this page</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="rounded-xl border border-stone-700 px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-800 hover:text-white"
            >
              Clear selection
            </button>
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected ({selectedIds.size})
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative">
          <span className="sr-only">Search products</span>
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            value={search}
            onChange={(event) => {
              setLoading(true);
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Search name, brand or slug"
            className="w-full rounded-xl border border-stone-300 bg-stone-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
        </label>
        <label>
          <span className="sr-only">Filter category</span>
          <select
            value={category}
            onChange={(event) => {
              setLoading(true);
              setPage(1);
              setCategory(event.target.value);
            }}
            className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter status</span>
          <select
            value={status}
            onChange={(event) => {
              setLoading(true);
              setPage(1);
              setStatus(event.target.value);
            }}
            className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Sort products</span>
          <select
            value={sort}
            onChange={(event) => {
              setLoading(true);
              setPage(1);
              setSort(event.target.value);
            }}
            className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm"
          >
            <option value="name">Name</option>
            <option value="newest">Newest</option>
            <option value="stock">Low stock</option>
            <option value="price">Price</option>
          </select>
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white">
        {loading ? (
          <p role="status" className="p-8 text-center text-sm text-stone-500">
            Loading products…
          </p>
        ) : !pageData.data.length ? (
          <p className="p-8 text-center text-sm text-stone-500">No products match these filters.</p>
        ) : (
          <table className="w-full min-w-[850px] text-left text-xs">
            <thead className="bg-stone-50 text-[10px] uppercase text-stone-500">
              <tr>
                <th className="w-10 px-4 py-3">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    aria-label="Select all products on page"
                    className="text-stone-500 hover:text-stone-900"
                  >
                    {allOnPageSelected ? (
                      <CheckSquare className="h-4 w-4 text-orange-600" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                {["Product", "Category", "Price", "Stock", "Status", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pageData.data.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <tr key={item.id} className={isSelected ? "bg-orange-50/40" : ""}>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSelectOne(item.id)}
                        aria-label={`Select ${item.name}`}
                        className="text-stone-400 hover:text-stone-900"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-stone-100 shrink-0">
                          <ProductImage
                            src={getPrimaryImage(item)}
                            alt=""
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-[10px] text-stone-500">
                            {item.brand} · {item.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {categories.find((cat) => cat.slug === item.category)?.name || item.category}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {formatBDT(item.discountPrice || item.price)}
                    </td>
                    <td className="px-4 py-3">{item.stock}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          item.isActive === false
                            ? "bg-stone-100 text-stone-600"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.isActive === false ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          title="Edit product"
                          href={`/admin/products/${item.id}`}
                          className="rounded-lg border border-stone-200 p-2 text-stone-700 hover:bg-stone-50"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          title={item.isActive === false ? "Activate" : "Deactivate"}
                          onClick={() => toggleActive(item)}
                          className="rounded-lg border border-stone-200 p-2 text-stone-700 hover:bg-stone-50"
                        >
                          {item.isActive === false ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          title="Remove product"
                          onClick={() => setProductToDelete(item)}
                          className="rounded-lg border border-rose-200 p-2 text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <footer className="flex items-center justify-between text-sm">
        <span>
          {pageData.total} products · page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() => {
              setLoading(true);
              setPage((value) => value - 1);
            }}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={page >= totalPages || loading}
            onClick={() => {
              setLoading(true);
              setPage((value) => value + 1);
            }}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </footer>

      {/* Single Product Deletion Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmSingleDelete}
        title={`Remove “${productToDelete?.name || "Product"}”?`}
        message="Remove this product from the active catalog? Products referenced in customer order history will be archived to protect order records, while unreferenced products are removed."
        variant="danger"
        confirmText="Remove Product"
        details={
          productToDelete ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-2 dark:border-stone-800 dark:bg-stone-850">
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Product:</span>
                <span className="font-semibold text-stone-900">{productToDelete.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Brand / Category:</span>
                <span className="text-stone-700">
                  {productToDelete.brand} · {productToDelete.category}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Current Price & Stock:</span>
                <span className="font-mono text-stone-700">
                  {formatBDT(productToDelete.discountPrice || productToDelete.price)} · {productToDelete.stock} in stock
                </span>
              </div>
            </div>
          ) : null
        }
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleConfirmBulkDelete}
        title={`Remove ${selectedIds.size} selected products?`}
        message={`Are you sure you want to remove all ${selectedIds.size} selected products from the catalog? Products in order history will be archived, and unreferenced products will be permanently removed.`}
        variant="danger"
        confirmText={`Remove ${selectedIds.size} Products`}
        details={
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-850">
            <p className="text-xs text-stone-600 mb-2">Affected products:</p>
            <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
              {pageData.data
                .filter((p) => selectedIds.has(p.id))
                .slice(0, 5)
                .map((p) => (
                  <li key={p.id} className="font-semibold text-stone-800 truncate">
                    • {p.name} ({p.brand})
                  </li>
                ))}
              {selectedIds.size > 5 && (
                <li className="text-stone-500 italic">+ {selectedIds.size - 5} more products</li>
              )}
            </ul>
          </div>
        }
      />
    </section>
  );
}
