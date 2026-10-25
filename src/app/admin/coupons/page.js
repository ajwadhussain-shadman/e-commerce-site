"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Tag,
  Percent,
  Ticket,
  Plus,
  Search,
  Check,
  X,
  Trash2,
  Edit3,
  Calendar,
  Sparkles,
  Copy,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { couponService, discountService, categoryService, productService } from "@/services/productService";
import { useToast } from "@/context/ToastContext";
import { formatBDT } from "@/lib/currency.mjs";
import ConfirmationModal from "@/components/common/ConfirmationModal";

export default function AdminCouponsAndDiscountsPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("coupons"); // "coupons" | "discounts"

  // Coupon state
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [couponSearch, setCouponSearch] = useState("");
  const [editingCoupon, setEditingCoupon] = useState(null); // null or coupon object
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [couponSubmitting, setCouponSubmitting] = useState(false);

  // Discount rules state
  const [discountRules, setDiscountRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [discountsLoading, setDiscountsLoading] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);

  // Discount apply form state
  const [discountForm, setDiscountForm] = useState({
    targetType: "all", // "all" | "category" | "product"
    category: "",
    productIds: [],
    discountPercentage: "12",
    discountTag: "12% OFF",
    campaignName: "Special 12% Discount",
  });
  const [productSearch, setProductSearch] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  // Initial fetch on mount
  useEffect(() => {
    let active = true;
    couponService.getAdminCoupons()
      .then((data) => {
        if (active) setCoupons(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) addToast(err.message || "Failed to load promo codes", "error");
      })
      .finally(() => {
        if (active) setCouponsLoading(false);
      });

    Promise.all([
      discountService.getDiscountRules(),
      categoryService.getCategories(),
      productService.getAllProducts(),
    ])
      .then(([rules, cats, prods]) => {
        if (!active) return;
        setDiscountRules(Array.isArray(rules) ? rules : []);
        setCategories(Array.isArray(cats) ? cats : []);
        setAllProducts(Array.isArray(prods) ? prods : []);
        setDiscountForm((prev) => {
          if (cats?.length && !prev.category) {
            return { ...prev, category: cats[0].slug };
          }
          return prev;
        });
      })
      .catch((err) => {
        console.warn("Could not load discount rules or catalog:", err.message);
      })
      .finally(() => {
        if (active) setDiscountsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [addToast]);

  const reloadCoupons = async (search = couponSearch) => {
    setCouponsLoading(true);
    try {
      const q = typeof search === "string" ? search : couponSearch;
      const data = await couponService.getAdminCoupons(q);
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || "Failed to load promo codes", "error");
    } finally {
      setCouponsLoading(false);
    }
  };

  const reloadDiscountsAndCatalog = async () => {
    setDiscountsLoading(true);
    try {
      const [rules, cats, prods] = await Promise.all([
        discountService.getDiscountRules(),
        categoryService.getCategories(),
        productService.getAllProducts(),
      ]);
      setDiscountRules(Array.isArray(rules) ? rules : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setAllProducts(Array.isArray(prods) ? prods : []);
    } catch (err) {
      console.warn("Could not load discount rules or catalog:", err.message);
    } finally {
      setDiscountsLoading(false);
    }
  };

  const loadCoupons = reloadCoupons;
  const loadDiscountsAndCatalog = reloadDiscountsAndCatalog;

  // Toggle Coupon Approval
  const handleToggleApproval = async (coupon) => {
    try {
      const nextApproval = !coupon.isApproved;
      await couponService.toggleApproval(coupon.id, nextApproval);
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isApproved: nextApproval } : c))
      );
      addToast(
        `Promo code "${coupon.code}" ${nextApproval ? "approved for customers" : "marked pending approval"}`,
        "success"
      );
    } catch (err) {
      addToast(err.message || "Could not update approval status", "error");
    }
  };

  // Toggle Coupon Active Status
  const handleToggleStatus = async (coupon) => {
    try {
      const nextStatus = !coupon.isActive;
      await couponService.toggleStatus(coupon.id, nextStatus);
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: nextStatus } : c))
      );
      addToast(`Promo code "${coupon.code}" ${nextStatus ? "activated" : "deactivated"}`, "info");
    } catch (err) {
      addToast(err.message || "Could not update active status", "error");
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async () => {
    if (!couponToDelete) return;
    try {
      await couponService.deleteCoupon(couponToDelete.id);
      setCoupons((prev) => prev.filter((c) => c.id !== couponToDelete.id));
      addToast(`Promo code "${couponToDelete.code}" deleted`, "success");
      setCouponToDelete(null);
    } catch (err) {
      addToast(err.message || "Could not delete promo code", "error");
    }
  };

  // Save Coupon (Create or Edit)
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    setCouponSubmitting(true);
    try {
      if (editingCoupon?.id) {
        await couponService.updateCoupon(editingCoupon.id, editingCoupon);
        addToast(`Promo code "${editingCoupon.code}" updated successfully`, "success");
      } else {
        await couponService.createCoupon(editingCoupon);
        addToast(`Promo code "${editingCoupon.code}" created successfully`, "success");
      }
      setIsCouponModalOpen(false);
      setEditingCoupon(null);
      reloadCoupons();
    } catch (err) {
      addToast(err.message || "Could not save promo code", "error");
    } finally {
      setCouponSubmitting(false);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingCoupon({
      code: "",
      description: "",
      discountType: "percent",
      discountValue: 12,
      minSpend: 0,
      maxDiscount: "",
      usageLimit: "",
      expiryDate: "",
      isApproved: true,
      isActive: true,
    });
    setIsCouponModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (coupon) => {
    setEditingCoupon({
      ...coupon,
      maxDiscount: coupon.maxDiscount ?? "",
      usageLimit: coupon.usageLimit ?? "",
      expiryDate: coupon.expiryDate ? coupon.expiryDate.split("T")[0] : "",
    });
    setIsCouponModalOpen(true);
  };

  // Apply or Remove Discount Tag on Catalog
  const handleExecuteDiscount = async (action = "apply") => {
    setApplyingDiscount(true);
    try {
      const payload = {
        action,
        targetType: discountForm.targetType,
        category: discountForm.category,
        productIds: discountForm.productIds,
        discountPercentage: discountForm.discountPercentage,
        discountTag: discountForm.discountTag,
        campaignName: discountForm.campaignName,
      };
      const res = await discountService.applyDiscount(payload);
      addToast(res.message || "Discount updated successfully", "success");
      reloadDiscountsAndCatalog();
    } catch (err) {
      addToast(err.message || "Failed to update discount", "error");
    } finally {
      setApplyingDiscount(false);
    }
  };

  // Delete Discount Rule
  const handleDeleteRule = async () => {
    if (!ruleToDelete) return;
    try {
      await discountService.removeDiscountRule(ruleToDelete.id, true);
      addToast(`Discount campaign "${ruleToDelete.campaignName}" removed and prices reverted`, "success");
      setRuleToDelete(null);
      reloadDiscountsAndCatalog();
    } catch (err) {
      addToast(err.message || "Could not remove discount campaign", "error");
    }
  };

  // Preset percentage handler
  const setDiscountPreset = (pct) => {
    setDiscountForm((prev) => ({
      ...prev,
      discountPercentage: String(pct),
      discountTag: `${pct}% OFF`,
      campaignName: `${pct}% OFF on ${prev.targetType === "all" ? "All Products" : prev.targetType === "category" ? prev.category : "Selected Products"}`,
    }));
  };

  // Filtered products for selection
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts.slice(0, 30);
    const q = productSearch.toLowerCase().trim();
    return allProducts.filter((p) => p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
  }, [allProducts, productSearch]);

  // Compute affected count preview
  const previewAffectedCount = useMemo(() => {
    if (discountForm.targetType === "all") return allProducts.length;
    if (discountForm.targetType === "category") {
      return allProducts.filter((p) => p.category === discountForm.category).length;
    }
    return discountForm.productIds.length;
  }, [discountForm.targetType, discountForm.category, discountForm.productIds, allProducts]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950 flex items-center gap-2">
            <Ticket className="w-7 h-7 text-amber-700" />
            Promo Codes &amp; Discount Tags
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage customer promo codes with approval controls and apply storewide, category, or product discount tags.
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex bg-stone-200/70 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("coupons")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === "coupons"
                ? "bg-white text-stone-950 shadow-xs font-bold"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Ticket className="w-4 h-4 text-amber-700" />
            Promo Codes ({coupons.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("discounts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === "discounts"
                ? "bg-white text-stone-950 shadow-xs font-bold"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Tag className="w-4 h-4 text-rose-600" />
            Discount Tags &amp; Rules ({discountRules.length})
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">Total Promo Codes</div>
          <div className="text-2xl font-bold text-stone-950">{coupons.length}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Configured codes</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">Customer Approved</div>
          <div className="text-2xl font-bold text-emerald-600">
            {coupons.filter((c) => c.isApproved && c.isActive).length}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Ready for checkout</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">Active Campaigns</div>
          <div className="text-2xl font-bold text-amber-800">
            {discountRules.filter((r) => r.isActive).length}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">Storewide &amp; Category tags</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">Total Redemptions</div>
          <div className="text-2xl font-bold text-stone-950">
            {coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">Orders used with code</div>
        </div>
      </div>

      {/* TAB 1: PROMO CODES */}
      {activeTab === "coupons" && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search promo codes or descriptions..."
                value={couponSearch}
                onChange={(e) => setCouponSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && reloadCoupons()}
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-amber-700"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => reloadCoupons()}
                className="p-2 border border-stone-300 rounded-xl hover:bg-stone-50 text-stone-600 transition-colors"
                title="Refresh list"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" /> Create Promo Code
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs">
            {couponsLoading ? (
              <div className="p-8 text-center text-xs text-stone-500">Loading promo codes...</div>
            ) : coupons.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Ticket className="w-10 h-10 text-stone-300 mx-auto" />
                <h3 className="text-sm font-semibold text-stone-800">No promo codes found</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Create your first promo code or click below to initialize default codes like &quot;IMPORT10&quot; and &quot;WELCOME500&quot;.
                </p>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl"
                >
                  Create Code
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Code &amp; Description</th>
                      <th className="py-3 px-4">Discount</th>
                      <th className="py-3 px-4">Min Spend / Max</th>
                      <th className="py-3 px-4">Usage</th>
                      <th className="py-3 px-4">Customer Approved</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {coupons.map((c) => {
                      const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();
                      return (
                        <tr key={c.id || c.code} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                                {c.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText?.(c.code);
                                  addToast(`Copied "${c.code}" to clipboard!`, "info");
                                }}
                                className="text-stone-400 hover:text-stone-700"
                                title="Copy code"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                              {c.description}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-stone-900">
                              {c.discountType === "percent"
                                ? `${c.discountValue}% OFF`
                                : c.discountType === "flat"
                                ? `৳${c.discountValue} Flat`
                                : "Free Shipping"}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono text-[11px]">
                            <div>Min: ৳{c.minSpend || 0}</div>
                            {c.maxDiscount ? (
                              <div className="text-stone-400">Cap: ৳{c.maxDiscount}</div>
                            ) : null}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-stone-900">
                              {c.usedCount || 0} {c.usageLimit ? `/ ${c.usageLimit}` : "uses"}
                            </div>
                            {isExpired && (
                              <span className="inline-block text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded mt-0.5">
                                Expired
                              </span>
                            )}
                          </td>

                          {/* Customer Approved Toggle */}
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleApproval(c)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                c.isApproved
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                  : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                              }`}
                            >
                              {c.isApproved ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  Approved
                                </>
                              ) : (
                                <>
                                  <AlertCircleIcon className="w-3.5 h-3.5 text-amber-600" />
                                  Pending Approval
                                </>
                              )}
                            </button>
                          </td>

                          {/* Active / Inactive Toggle */}
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(c)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                                c.isActive
                                  ? "bg-stone-900 text-white"
                                  : "bg-stone-200 text-stone-600"
                              }`}
                            >
                              {c.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(c)}
                                className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setCouponToDelete(c)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DISCOUNT TAGS & BULK RULES */}
      {activeTab === "discounts" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Apply Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-serif font-bold text-stone-950 flex items-center gap-2">
                <Tag className="w-5 h-5 text-rose-600" />
                Apply Discount Tag &amp; Percentage
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Apply a discount tag like &quot;12% OFF&quot; across your entire store, an entire category, or specific products.
              </p>
            </div>

            {/* Target Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 block">
                Target Scope:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "all", label: "Storewide (All Products)", icon: ShoppingBag },
                  { id: "category", label: "Specific Category", icon: Layers },
                  { id: "product", label: "Specific Product(s)", icon: Tag },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = discountForm.targetType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setDiscountForm((prev) => ({
                          ...prev,
                          targetType: t.id,
                          campaignName: `${prev.discountTag} on ${
                            t.id === "all"
                              ? "All Products"
                              : t.id === "category"
                              ? prev.category
                              : "Selected Products"
                          }`,
                        }))
                      }
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? "border-amber-700 bg-amber-50/50 ring-1 ring-amber-700/20"
                          : "border-stone-200 hover:border-stone-300 bg-stone-50/50"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? "text-amber-800" : "text-stone-400"}`} />
                      <span className={`text-xs font-bold ${isSelected ? "text-amber-900" : "text-stone-700"}`}>
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Dropdown (if target is category) */}
            {discountForm.targetType === "category" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 block">
                  Select Category:
                </label>
                <select
                  value={discountForm.category}
                  onChange={(e) =>
                    setDiscountForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                      campaignName: `${prev.discountTag} on ${e.target.value}`,
                    }))
                  }
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-amber-700"
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name} ({c.itemCount ?? 0} items)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Specific Product Multi-Select (if target is product) */}
            {discountForm.targetType === "product" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-700">
                    Select Products ({discountForm.productIds.length} selected):
                  </label>
                  {discountForm.productIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDiscountForm((prev) => ({ ...prev, productIds: [] }))}
                      className="text-[11px] text-rose-600 font-semibold hover:underline"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Filter products by name or brand..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                />

                <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-xl divide-y divide-stone-100 p-1">
                  {filteredProducts.map((p) => {
                    const isSelected = discountForm.productIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setDiscountForm((prev) => ({
                            ...prev,
                            productIds: isSelected
                              ? prev.productIds.filter((id) => id !== p.id)
                              : [...prev.productIds, p.id],
                          }));
                        }}
                        className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                          isSelected ? "bg-amber-50 text-amber-950 font-bold" : "hover:bg-stone-50"
                        }`}
                      >
                        <div className="line-clamp-1 flex-1 pr-2">
                          {p.name} <span className="text-stone-400 font-normal">({p.brand})</span>
                        </div>
                        <div className="shrink-0 font-mono text-[11px] text-stone-600">
                          {formatBDT(p.price)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Discount Percentage and Discount Tag Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    Discount Percentage (%):
                  </label>
                  <div className="flex items-center gap-1">
                    {[10, 12, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDiscountPreset(pct)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-stone-300 hover:border-amber-600 bg-white"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={discountForm.discountPercentage}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDiscountForm((prev) => ({
                        ...prev,
                        discountPercentage: val,
                        discountTag: val ? `${val}% OFF` : prev.discountTag,
                      }));
                    }}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono text-xs pr-8 focus:outline-hidden focus:border-amber-700"
                  />
                  <span className="absolute right-3 top-2.5 text-stone-400 font-bold text-xs">%</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Discount Tag (Badge text on storefront):
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12% OFF or Mega Deal"
                  value={discountForm.discountTag}
                  onChange={(e) => setDiscountForm((prev) => ({ ...prev, discountTag: e.target.value }))}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-rose-600 focus:outline-hidden focus:border-amber-700"
                />
              </div>
            </div>

            {/* Campaign Name */}
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Campaign / Rule Label:
              </label>
              <input
                type="text"
                placeholder="e.g. Summer Special 12% OFF"
                value={discountForm.campaignName}
                onChange={(e) => setDiscountForm((prev) => ({ ...prev, campaignName: e.target.value }))}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-amber-700"
              />
            </div>

            {/* Summary preview and Action Buttons */}
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-amber-950 block">Ready to Apply:</span>
                <span className="text-amber-800">
                  Tag <strong className="text-rose-600">{discountForm.discountTag}</strong> will be applied to{" "}
                  <strong>{previewAffectedCount}</strong> product(s).
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={applyingDiscount}
                  onClick={() => handleExecuteDiscount("remove")}
                  className="px-3 py-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-bold rounded-xl text-xs disabled:opacity-50"
                >
                  Reset / Remove Tag
                </button>
                <button
                  type="button"
                  disabled={applyingDiscount || previewAffectedCount === 0}
                  onClick={() => handleExecuteDiscount("apply")}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50"
                >
                  {applyingDiscount ? "Applying..." : "Apply Discount Now"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Col: Active Campaigns List */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-serif font-bold text-stone-950 flex items-center justify-between">
              <span>Active Discount Campaigns</span>
              <span className="text-xs font-sans text-stone-400 font-normal">
                {discountRules.length} rules
              </span>
            </h3>

            {discountsLoading ? (
              <p className="text-xs text-stone-500">Loading campaigns...</p>
            ) : discountRules.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400 space-y-2">
                <Tag className="w-8 h-8 mx-auto text-stone-300" />
                <p>No active bulk campaigns yet.</p>
                <p className="text-[11px] text-stone-500">
                  Use the form to apply discount tags across categories or all products.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {discountRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs text-stone-900">{rule.campaignName}</div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          Target:{" "}
                          <span className="capitalize font-semibold text-stone-700">
                            {rule.targetType === "category" ? `Category: ${rule.category}` : rule.targetType}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-rose-600 text-white font-black text-[10px] rounded-md uppercase">
                        {rule.discountTag}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-200/80 text-[11px] text-stone-400">
                      <span>Affected: {rule.affectedCount ?? "?"} items</span>
                      <button
                        type="button"
                        onClick={() => setRuleToDelete(rule)}
                        className="text-rose-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Revert
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT PROMO CODE MODAL */}
      {isCouponModalOpen && editingCoupon && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 w-full max-w-lg p-6 shadow-xl space-y-5 animate-fade-in my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h2 className="text-lg font-serif font-bold text-stone-950">
                {editingCoupon.id ? "Edit Promo Code" : "Create New Promo Code"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsCouponModalOpen(false);
                  setEditingCoupon(null);
                }}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    Promo Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAVE12"
                    value={editingCoupon.code}
                    onChange={(e) =>
                      setEditingCoupon((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                    }
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold uppercase focus:outline-hidden focus:border-amber-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={editingCoupon.discountType}
                    onChange={(e) =>
                      setEditingCoupon((prev) => ({ ...prev, discountType: e.target.value }))
                    }
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-semibold focus:outline-hidden focus:border-amber-700"
                  >
                    <option value="percent">Percentage Off (%)</option>
                    <option value="flat">Flat Amount (৳)</option>
                    <option value="shipping">Free Delivery</option>
                  </select>
                </div>
              </div>

              {editingCoupon.discountType !== "shipping" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">
                      {editingCoupon.discountType === "percent"
                        ? "Discount Percentage (%) *"
                        : "Flat Discount Amount (৳) *"}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={editingCoupon.discountType === "percent" ? 100 : undefined}
                      value={editingCoupon.discountValue}
                      onChange={(e) =>
                        setEditingCoupon((prev) => ({ ...prev, discountValue: e.target.value }))
                      }
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-hidden focus:border-amber-700"
                    />
                  </div>

                  {editingCoupon.discountType === "percent" && (
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">
                        Max Discount Cap (৳, optional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 1500"
                        value={editingCoupon.maxDiscount}
                        onChange={(e) =>
                          setEditingCoupon((prev) => ({ ...prev, maxDiscount: e.target.value }))
                        }
                        className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-hidden focus:border-amber-700"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12% off on all orders above ৳1,000"
                  value={editingCoupon.description}
                  onChange={(e) =>
                    setEditingCoupon((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    Min Order (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={editingCoupon.minSpend}
                    onChange={(e) =>
                      setEditingCoupon((prev) => ({ ...prev, minSpend: e.target.value }))
                    }
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-hidden focus:border-amber-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    Usage Limit (uses)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={editingCoupon.usageLimit}
                    onChange={(e) =>
                      setEditingCoupon((prev) => ({ ...prev, usageLimit: e.target.value }))
                    }
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-hidden focus:border-amber-700"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={editingCoupon.expiryDate}
                    onChange={(e) =>
                      setEditingCoupon((prev) => ({ ...prev, expiryDate: e.target.value }))
                    }
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={editingCoupon.isApproved}
                    onChange={(e) =>
                      setEditingCoupon((prev) => ({ ...prev, isApproved: e.target.checked }))
                    }
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>User Approved (Customers can redeem this code)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={editingCoupon.isActive}
                    onChange={(e) =>
                      setEditingCoupon((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Active Status</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsCouponModalOpen(false);
                    setEditingCoupon(null);
                  }}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={couponSubmitting}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {couponSubmitting ? "Saving..." : "Save Promo Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Coupon */}
      <ConfirmationModal
        isOpen={Boolean(couponToDelete)}
        title="Delete Promo Code"
        message={`Are you sure you want to delete promo code "${couponToDelete?.code}"? Existing orders referencing this code will preserve their history.`}
        confirmLabel="Delete Code"
        onConfirm={handleDeleteCoupon}
        onCancel={() => setCouponToDelete(null)}
        isDestructive
      />

      {/* Delete Confirmation Modal for Discount Rule */}
      <ConfirmationModal
        isOpen={Boolean(ruleToDelete)}
        title="Revert Discount Campaign"
        message={`Reverting campaign "${ruleToDelete?.campaignName}" will restore original regular prices for affected products.`}
        confirmLabel="Revert & Remove"
        onConfirm={handleDeleteRule}
        onCancel={() => setRuleToDelete(null)}
        isDestructive
      />
    </div>
  );
}

function AlertCircleIcon(props) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
