"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Package, ShoppingBag, Users, Tags } from "lucide-react";
import { productService } from "@/services/productService";
import { formatBDT } from "@/lib/currency.mjs";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    productService.getAdminMetrics().then((data) => { if (active) setMetrics(data); })
      .catch((loadError) => { if (active) setError(loadError.message || "Could not load dashboard metrics."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  if (loading) return <p role="status" className="p-8 text-sm text-stone-500">Loading store metrics…</p>;
  if (error) return <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>;
  const cards = [
    ["Active products", metrics.activeProducts, Package], ["Categories", metrics.categories, Tags],
    ["Customers", metrics.customers, Users], ["Orders", metrics.totalOrders, ShoppingBag],
    ["Pending fulfillment", metrics.pendingOrders, AlertTriangle], ["Delivered COD order value", formatBDT(metrics.deliveredCodOrderValue), ShoppingBag],
  ];
  return <div className="space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-serif font-bold">Store overview</h1><p className="mt-1 text-xs text-stone-500">Live counts from MongoDB. Delivered COD value is order value, not payment confirmation.</p></div><Link href="/admin/products/new" className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white">Add product</Link></header>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value, Icon]) => <article key={label} className="rounded-2xl border border-stone-200 bg-white p-5"><div className="flex items-center justify-between text-xs font-semibold text-stone-500"><span>{label}</span><Icon className="h-4 w-4"/></div><p className="mt-3 text-2xl font-bold text-stone-950">{value}</p></article>)}</div>
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border border-stone-200 bg-white p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Recent orders</h2><Link href="/admin/orders" className="text-xs text-amber-900 underline">All orders</Link></div>{metrics.recentOrders.length ? <ul className="divide-y divide-stone-100">{metrics.recentOrders.map((order) => <li key={order.id} className="flex justify-between gap-4 py-3 text-sm"><span><strong>{order.id}</strong><span className="block text-xs text-stone-500">{order.customer?.fullName || "Customer"} · {order.status}</span></span><span className="font-semibold">{formatBDT(order.total)}</span></li>)}</ul> : <p className="py-5 text-sm text-stone-500">No orders yet.</p>}</section>
      <section className="rounded-2xl border border-stone-200 bg-white p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Low stock (below 15)</h2><Link href="/admin/products" className="text-xs text-amber-900 underline">Inventory</Link></div>{metrics.lowStock.length ? <ul className="divide-y divide-stone-100">{metrics.lowStock.map((product) => <li key={product.id} className="flex justify-between gap-4 py-3 text-sm"><span>{product.name}</span><strong className="text-rose-700">{product.stock} left</strong></li>)}</ul> : <p className="py-5 text-sm text-stone-500">No active products are below the threshold.</p>}</section>
    </div>
  </div>;
}
