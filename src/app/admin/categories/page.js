"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { categoryService } from "@/services/productService";
import { useToast } from "@/context/ToastContext";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { ExternalLink, Plus, Save, Trash2, X, AlertTriangle } from "lucide-react";

const emptyCategory = { name: "", slug: "", description: "", image: "", banner: "", subcategories: "" };

export default function AdminCategoriesPage() {
  const { addToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [originalSlug, setOriginalSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await categoryService.getCategories());
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Could not load categories.");
      addToast(loadError.message || "Could not load categories.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    let active = true;
    categoryService
      .getCategories()
      .then((data) => {
        if (active) {
          setCategories(data);
          setError("");
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Could not load categories.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const edit = (category) => {
    setOriginalSlug(category?.slug || "");
    setForm(
      category
        ? {
            name: category.name || "",
            slug: category.slug || "",
            description: category.description || "",
            image: category.image || "",
            banner: category.banner || "",
            subcategories: (category.subcategories || []).join(", "),
          }
        : { ...emptyCategory }
    );
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        subcategories: form.subcategories
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      };
      if (originalSlug) await categoryService.updateCategory(originalSlug, payload);
      else await categoryService.createCategory(payload);
      addToast(originalSlug ? "Category updated." : "Category created.", "success");
      setForm(null);
      await load();
    } catch (saveError) {
      setError(saveError.message || "Could not save category.");
      addToast(saveError.message || "Could not save category.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await categoryService.deleteCategory(categoryToDelete.slug);
      addToast(`Category “${categoryToDelete.name}” deleted.`, "success");
      setCategoryToDelete(null);
      await load();
    } catch (deleteError) {
      const errorMsg = deleteError.message || "Could not delete category.";
      setError(errorMsg);
      addToast(errorMsg, "error");
      // Re-throw so the modal remains open displaying the backend error message
      throw deleteError;
    }
  };

  const hasProducts = Boolean(categoryToDelete && (categoryToDelete.itemCount || 0) > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-950">
            Category Taxonomy & Subcategories
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            Categories are loaded from the store database. A category with products cannot be deleted.
          </p>
        </div>
        <button
          onClick={() => edit(null)}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      )}

      <label className="block">
        <span className="sr-only">Search categories</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search category name or slug"
          className="w-full max-w-md rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />
      </label>

      {form && (
        <form
          onSubmit={handleSave}
          className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-2 shadow-xs"
        >
          <h2 className="text-base font-bold sm:col-span-2">
            {originalSlug ? "Edit category" : "New category"}
          </h2>
          {[
            ["name", "Name"],
            ["slug", "Slug"],
            ["image", "Image URL"],
            ["banner", "Banner URL"],
          ].map(([key, label]) => (
            <label key={key} className="text-xs font-semibold">
              {label}
              <input
                required={key === "name"}
                type={key === "image" || key === "banner" ? "url" : "text"}
                value={form[key]}
                onChange={(event) =>
                  setForm((current) => ({ ...current, [key]: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 p-2.5 text-xs"
              />
            </label>
          ))}
          <label className="text-xs font-semibold sm:col-span-2">
            Description
            <textarea
              rows={2}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 p-2.5 text-xs"
            />
          </label>
          <label className="text-xs font-semibold sm:col-span-2">
            Subcategories (comma separated)
            <input
              value={form.subcategories}
              onChange={(event) =>
                setForm((current) => ({ ...current, subcategories: event.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 p-2.5 text-xs"
            />
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={() => setForm(null)}
              className="inline-flex items-center gap-1 rounded-xl border border-stone-300 px-4 py-2 text-xs font-semibold hover:bg-stone-50"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p role="status" className="py-10 text-center text-sm text-stone-500">
          Loading categories...
        </p>
      ) : categories.filter((item) =>
          `${item.name} ${item.slug}`.toLowerCase().includes(search.toLowerCase().trim())
        ).length === 0 ? (
        <p className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
          No categories match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {categories
            .filter((item) =>
              `${item.name} ${item.slug}`.toLowerCase().includes(search.toLowerCase().trim())
            )
            .map((category) => (
              <article
                key={category.slug}
                className="flex flex-col justify-between space-y-4 rounded-3xl border border-stone-200/90 bg-white p-5 shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-base font-bold text-stone-950">
                        {category.name}
                      </h3>
                      <p className="mt-1 text-xs text-stone-500">{category.description}</p>
                    </div>
                    <span className="shrink-0 rounded bg-stone-100 px-2 py-0.5 font-mono text-[10px] font-bold text-stone-700">
                      {category.itemCount || 0} SKUs
                    </span>
                  </div>
                  <div className="mt-4">
                    <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Subcategories ({category.subcategories?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {category.subcategories?.map((sub) => (
                        <span
                          key={sub}
                          className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-700"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
                  <Link
                    href={`/categories/${category.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 font-bold text-amber-900 hover:underline"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </Link>
                  <div className="flex gap-2">
                    <button
                      onClick={() => edit(category)}
                      className="rounded-lg border border-stone-300 px-3 py-1.5 font-semibold hover:bg-stone-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setCategoryToDelete(category)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete “${categoryToDelete?.name || "Category"}”?`}
        message={
          hasProducts
            ? "This category currently contains active products. Categories with products cannot be deleted by the database."
            : `Are you sure you want to permanently delete “${categoryToDelete?.name}”? This action cannot be undone.`
        }
        variant="danger"
        confirmText={hasProducts ? "Attempt Deletion" : "Delete Category"}
        details={
          categoryToDelete ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-2 dark:border-stone-800 dark:bg-stone-850">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">Category Name:</span>
                  <span className="font-semibold text-stone-900">{categoryToDelete.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">Slug:</span>
                  <span className="font-mono text-stone-700">{categoryToDelete.slug}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">Associated SKUs:</span>
                  <span className="font-bold text-stone-900">{categoryToDelete.itemCount || 0} products</span>
                </div>
              </div>

              {hasProducts && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Warning:</strong> You must move or remove the {categoryToDelete.itemCount} product(s) in this category before deleting it. The server will reject deletion if products remain.
                  </p>
                </div>
              )}
            </div>
          ) : null
        }
      />
    </div>
  );
}
