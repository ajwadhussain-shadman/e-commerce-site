"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { products } from "@/data/products";
import { orderService } from "@/services/orderService";
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Clock, 
  ArrowUpRight, 
  ArrowRight,
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from "lucide-react";

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [productList, setProductList] = useState(products);

  useEffect(() => {
    async function load() {
      const data = await orderService.getAllOrders();
      setOrders(data);
    }
    load();
  }, []);

  const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === "Pending" || o.status === "Processing");
  const lowStockProducts = productList.filter(p => p.stock < 15);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title & Demo note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950">
            Store Performance Overview
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time local inventory monitoring, sales analytics, and fulfillment pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            + Add New Product
          </Link>
          <Link
            href="/admin/orders"
            className="px-4 py-2 bg-white border border-stone-300 text-stone-800 hover:bg-stone-50 text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            Manage Orders
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="p-5 bg-white rounded-3xl border border-stone-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Demo Gross Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-stone-950">
            ৳{totalSales.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% from last week (Demo)
          </p>
        </div>

        {/* Total Orders */}
        <div className="p-5 bg-white rounded-3xl border border-stone-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-stone-950">
            {orders.length} Orders
          </div>
          <p className="text-[11px] text-stone-500">
            Stored in local demo order store
          </p>
        </div>

        {/* Products in Catalog */}
        <div className="p-5 bg-white rounded-3xl border border-stone-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Active Imported SKUs</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-stone-950">
            {productList.length} Products
          </div>
          <p className="text-[11px] text-stone-500">
            Across 7 imported categories
          </p>
        </div>

        {/* Pending Shipments */}
        <div className="p-5 bg-white rounded-3xl border border-stone-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Pending Dispatch</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-rose-800">
            {pendingOrders.length} Shipments
          </div>
          <p className="text-[11px] text-rose-600 font-medium">
            Requires warehouse packing
          </p>
        </div>
      </div>

      {/* Visual Sales Trend Bar Chart Simulation */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-stone-950">
              Weekly Revenue Analytics (Demo BDT)
            </h3>
            <p className="text-xs text-stone-500">Daily sales breakdown across Dhaka & outside districts</p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
            ৳24,980 Avg / Day
          </span>
        </div>

        {/* Visual Bar chart with SVG / CSS flex */}
        <div className="pt-6 pb-2">
          <div className="h-44 flex items-end justify-between gap-2 sm:gap-6 border-b border-stone-200 px-2">
            {[
              { day: "Sat", amount: 18200, height: "65%" },
              { day: "Sun", amount: 22400, height: "78%" },
              { day: "Mon", amount: 15900, height: "55%" },
              { day: "Tue", amount: 28400, height: "95%" },
              { day: "Wed", amount: 21500, height: "72%" },
              { day: "Thu", amount: 31200, height: "100%" },
              { day: "Fri", amount: 26800, height: "88%" },
            ].map((col, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[10px] text-stone-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  ৳{col.amount.toLocaleString()}
                </div>
                <div
                  className="w-full bg-stone-900 group-hover:bg-amber-700 rounded-t-xl transition-all duration-300"
                  style={{ height: col.height }}
                />
                <span className="text-xs font-semibold text-stone-600">{col.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two columns: Recent Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-950">Recent Customer Orders</h3>
              <p className="text-xs text-stone-500">Live order stream received from checkout</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-amber-900 hover:underline flex items-center gap-1"
            >
              All Orders <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 font-semibold uppercase tracking-wider">
                  <th className="pb-2.5">Order ID</th>
                  <th className="pb-2.5">Customer</th>
                  <th className="pb-2.5">Items</th>
                  <th className="pb-2.5">Amount</th>
                  <th className="pb-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 font-mono font-bold text-stone-900">
                      <Link href={`/track-order?id=${order.id}`} className="hover:text-amber-800 underline">
                        {order.id}
                      </Link>
                    </td>
                    <td className="py-3 text-stone-800 font-medium">
                      {order.customer?.fullName}
                      <span className="block text-[10px] text-stone-400">{order.customer?.district}</span>
                    </td>
                    <td className="py-3 text-stone-600">
                      {order.items?.length} items
                    </td>
                    <td className="py-3 font-bold text-stone-950 font-serif">
                      ৳{order.total}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === "Delivered"
                          ? "bg-emerald-100 text-emerald-800"
                          : order.status === "Shipped"
                          ? "bg-blue-100 text-blue-800"
                          : order.status === "Processing"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="font-serif font-bold text-base text-stone-950 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Low Stock Alerts
            </h3>
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
              {lowStockProducts.length} SKUs
            </span>
          </div>

          <div className="divide-y divide-stone-100 space-y-2">
            {lowStockProducts.slice(0, 5).map((prod) => (
              <div key={prod.id} className="pt-2 flex items-center justify-between text-xs">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="font-semibold text-stone-900 truncate">{prod.name}</div>
                  <div className="text-[11px] text-stone-500">{prod.brand}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded font-bold font-mono text-[11px]">
                    {prod.stock} left
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/admin/products"
            className="block text-center py-2 text-xs font-semibold text-amber-900 hover:underline pt-3 border-t border-stone-100"
          >
            Review All Inventory →
          </Link>
        </div>

      </div>

    </div>
  );
}
