"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Filter } from "lucide-react";
import Link from "next/link";
import { orderService } from "@/services/orderService";
import { useToast } from "@/context/ToastContext";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { formatBDT } from "@/lib/currency.mjs";

const NEXT_STATUSES = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Processing", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

export default function AdminOrdersPage() {
  const { addToast } = useToast();
  const [pageData, setPageData] = useState({ data: [], total: 0, page: 1, limit: 25 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingCancellation, setPendingCancellation] = useState(null);

  const load = useCallback(async () => {
    try {
      const result = await orderService.getOrderPage({ page, limit: 25, search, status, from, to });
      setPageData(result);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Could not load orders.");
      addToast(loadError.message || "Could not load orders.", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, from, to, addToast]);

  useEffect(() => {
    let active = true;
    orderService
      .getOrderPage({ page, limit: 25, search, status, from, to })
      .then((result) => {
        if (active) {
          setPageData(result);
          setError("");
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Could not load orders.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, search, status, from, to]);

  const handleStatusSelect = (order, nextStatus) => {
    if (!nextStatus) return;
    if (nextStatus === "Cancelled") {
      setPendingCancellation(order);
    } else {
      executeStatusChange(order.id, nextStatus);
    }
  };

  const executeStatusChange = async (orderId, nextStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, nextStatus);
      addToast(`Order ${orderId} updated to ${nextStatus}.`, "success");
      setLoading(true);
      await load();
    } catch (actionError) {
      const msg = actionError.message || "Could not update order status.";
      addToast(msg, "error");
      throw actionError;
    }
  };

  const handleConfirmCancellation = async () => {
    if (!pendingCancellation) return;
    try {
      await orderService.updateOrderStatus(pendingCancellation.id, "Cancelled");
      addToast(`Order ${pendingCancellation.id} has been cancelled and stock restored.`, "success");
      setPendingCancellation(null);
      setLoading(true);
      await load();
    } catch (actionError) {
      const msg = actionError.message || "Could not cancel order.";
      addToast(msg, "error");
      throw actionError;
    }
  };

  const pages = Math.max(1, Math.ceil(pageData.total / pageData.limit));

  return (
    <section className="space-y-6">
      <header className="border-b border-stone-200 pb-4">
        <h1 className="text-2xl font-serif font-bold">Order fulfillment</h1>
        <p className="mt-1 text-xs text-stone-500">
          Live orders, verified transitions and stock restoration on cancellation.
        </p>
      </header>

      <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-5">
        <label className="sm:col-span-2 xl:col-span-1">
          <span className="sr-only">Search orders</span>
          <input
            value={search}
            onChange={(event) => {
              setLoading(true);
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Order, customer, phone, email"
            className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4 text-stone-500" />
          <select
            aria-label="Status"
            value={status}
            onChange={(event) => {
              setLoading(true);
              setPage(1);
              setStatus(event.target.value);
            }}
            className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2"
          >
            <option value="">All statuses</option>
            {Object.keys(NEXT_STATUSES).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          From
          <input
            aria-label="From date"
            type="date"
            value={from}
            onChange={(event) => {
              setLoading(true);
              setPage(1);
              setFrom(event.target.value);
            }}
            className="mt-1 block w-full rounded-xl border border-stone-300 p-2"
          />
        </label>
        <label className="text-xs">
          Through
          <input
            aria-label="To date"
            type="date"
            value={to}
            onChange={(event) => {
              setLoading(true);
              setPage(1);
              setTo(event.target.value);
            }}
            className="mt-1 block w-full rounded-xl border border-stone-300 p-2"
          />
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
            Loading orders…
          </p>
        ) : !pageData.data.length ? (
          <p className="p-8 text-center text-sm text-stone-500">No orders match these filters.</p>
        ) : (
          <table className="w-full min-w-[1000px] text-left text-xs">
            <thead className="bg-stone-50 text-[10px] uppercase text-stone-500">
              <tr>
                {["Order", "Date", "Customer / delivery", "Items", "Total (COD)", "Status", "Update", "Tracking"].map(
                  (label) => (
                    <th key={label} className="px-4 py-3">
                      {label}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pageData.data.map((order) => (
                <tr key={order.id} className="align-top">
                  <td className="px-4 py-3 font-mono font-bold">
                    {order.id}
                    <span className="mt-1 block font-sans text-[10px] font-normal text-stone-500">
                      {order.paymentMethod || "Cash on Delivery"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <strong>{order.customer?.fullName || "—"}</strong>
                    <span className="block text-stone-500">{order.customer?.phone}</span>
                    <span className="block text-stone-500">
                      {[order.customer?.district, order.customer?.area, order.customer?.address]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </td>
                  <td className="max-w-[240px] px-4 py-3">
                    {(order.items || []).map((item, index) => (
                      <p key={`${item.id}-${index}`} className="mb-1">
                        {item.name} × {item.quantity}{" "}
                        <span className="text-stone-500">@ {formatBDT(item.price)}</span>
                      </p>
                    ))}
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {formatBDT(order.total)}
                    <span className="block text-[10px] font-normal text-stone-500">
                      COD; collection unverified
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        order.status === "Cancelled"
                          ? "bg-rose-100 text-rose-800"
                          : order.status === "Delivered"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-stone-100 text-stone-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Update ${order.id} status`}
                      value=""
                      disabled={!NEXT_STATUSES[order.status]?.length}
                      onChange={(event) => handleStatusSelect(order, event.target.value)}
                      className="rounded-lg border border-stone-300 bg-stone-50 p-2 text-xs"
                    >
                      <option value="">
                        {NEXT_STATUSES[order.status]?.length ? "Choose…" : "Final"}
                      </option>
                      {NEXT_STATUSES[order.status]?.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/track-order?id=${encodeURIComponent(order.id)}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-amber-900 underline"
                    >
                      Track <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer className="flex items-center justify-between text-sm">
        <span>
          {pageData.total} orders · page {page} of {pages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() => {
              setLoading(true);
              setPage(page - 1);
            }}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={page >= pages || loading}
            onClick={() => {
              setLoading(true);
              setPage(page + 1);
            }}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </footer>

      {/* Cancel Order Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(pendingCancellation)}
        onClose={() => setPendingCancellation(null)}
        onConfirm={handleConfirmCancellation}
        title={`Cancel order ${pendingCancellation?.id}?`}
        message="Cancelling an order is irreversible. The reserved stock for all items in this order will be restored into active catalog inventory."
        variant="danger"
        confirmText="Cancel Order"
        details={
          pendingCancellation ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-2 dark:border-stone-800 dark:bg-stone-850">
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Customer:</span>
                <span className="font-semibold text-stone-900">
                  {pendingCancellation.customer?.fullName || "—"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Phone:</span>
                <span className="font-mono text-stone-700">{pendingCancellation.customer?.phone || "—"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Total COD Amount:</span>
                <span className="font-bold text-stone-900 font-mono">
                  {formatBDT(pendingCancellation.total)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Ordered Items:</span>
                <span className="text-stone-700">{pendingCancellation.items?.length || 0} line item(s)</span>
              </div>
            </div>
          ) : null
        }
      />
    </section>
  );
}
