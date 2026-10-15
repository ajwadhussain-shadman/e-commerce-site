"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { orderService } from "@/services/orderService";
import { useToast } from "@/context/ToastContext";
import { Package, ExternalLink, Filter, CheckCircle2 } from "lucide-react";

export default function AdminOrdersPage() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadOrders = async () => {
    const list = await orderService.getAllOrders();
    setOrders(list);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      addToast(`Updated ${orderId} status to "${newStatus}"`, "success");
      loadOrders();
    } catch (e) {
      console.error(e);
      alert("Could not update order status");
    }
  };

  const filteredOrders = statusFilter === "all"
    ? orders
    : orders.filter(o => o.status === statusFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-950">
            Order Fulfillment & Shipping
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Advance order workflow states and review customer parcel consignments.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold focus:outline-hidden"
          >
            <option value="all">All Statuses ({orders.length})</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer & Phone</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Update Status</th>
                <th className="py-3 px-4 text-right">Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-stone-50/70 transition-colors">
                  
                  <td className="py-3.5 px-4 font-mono font-bold text-stone-950">
                    {ord.id}
                  </td>

                  <td className="py-3.5 px-4 text-stone-500 text-[11px] whitespace-nowrap">
                    {new Date(ord.createdAt).toLocaleDateString()}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-stone-900 block">{ord.customer?.fullName}</span>
                    <span className="text-[11px] text-stone-500 font-mono">{ord.customer?.phone}</span>
                  </td>

                  <td className="py-3.5 px-4 text-stone-600">
                    <span className="font-medium text-stone-900 block">{ord.customer?.district}</span>
                    <span className="text-[10px] text-stone-400 truncate max-w-[120px] block">{ord.customer?.area}</span>
                  </td>

                  <td className="py-3.5 px-4 text-stone-600">
                    <span className="font-medium text-stone-900 block">
                      {ord.items?.length} {ord.items?.length === 1 ? "item" : "items"}
                    </span>
                    <span className="text-[10px] text-stone-400 truncate max-w-[140px] block">
                      {ord.items?.[0]?.name}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-stone-950 font-serif">
                    ৳{ord.total}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      ord.status === "Delivered"
                        ? "bg-emerald-100 text-emerald-800"
                        : ord.status === "Shipped"
                        ? "bg-blue-100 text-blue-800"
                        : ord.status === "Processing"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}>
                      {ord.status}
                    </span>
                  </td>

                  {/* Interactive status updater dropdown */}
                  <td className="py-3.5 px-4">
                    <select
                      value={ord.status}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                      className="px-2.5 py-1 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold cursor-pointer focus:outline-hidden"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/track-order?id=${ord.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline"
                    >
                      Live View <ExternalLink className="w-3 h-3" />
                    </Link>
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
