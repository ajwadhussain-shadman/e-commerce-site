"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";
import ProductImage from "@/components/products/ProductImage";
import { orderService } from "@/services/orderService";
import { formatBDT } from "@/lib/currency.mjs";
import { CheckCircle2, Package, Sparkles } from "lucide-react";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (orderId) {
        setIsLoading(true);
        const data = await orderService.getOrderById(orderId);
        setOrder(data);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    }
    load();
  }, [orderId]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full">
        
        {/* Success Card Header */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-stone-200/90 shadow-lg text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Order Confirmed
          </span>

          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-stone-950">
            Thank You for Your Order!
          </h1>

          <p className="text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
            Your imported goods order has been received. Payment is due on delivery.
          </p>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 inline-block font-mono text-sm text-stone-800 font-bold">
            Order Reference: <span className="text-amber-800">{order?.id || orderId || "Unavailable"}</span>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/track-order?id=${order?.id || orderId || ""}`}
              className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <Package className="w-4 h-4 text-amber-300" /> Track Live Order Status
            </Link>
            <Link
              href="/products"
              className="px-6 py-3 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-full text-xs font-semibold transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Details Breakdown */}
        {order && (
          <div className="mt-8 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs space-y-6">
            <h2 className="text-lg font-serif font-bold text-stone-950 pb-3 border-b border-stone-100">
              Order Breakdown
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2 p-4 bg-stone-50 rounded-2xl">
                <span className="font-bold text-stone-900 uppercase tracking-wider text-[11px] block">
                  Delivery Details
                </span>
                <p className="font-semibold text-stone-950">{order.customer?.fullName}</p>
                <p className="text-stone-600">{order.customer?.phone}</p>
                <p className="text-stone-600">{order.customer?.address}, {order.customer?.area}, {order.customer?.district}</p>
              </div>

              <div className="space-y-2 p-4 bg-stone-50 rounded-2xl">
                <span className="font-bold text-stone-900 uppercase tracking-wider text-[11px] block">
                  Payment Summary
                </span>
                <p className="text-stone-600">Payment: <strong className="text-stone-900">{order.paymentMethod}</strong></p>
                <p className="text-stone-600">Status: <strong className="text-amber-800 font-semibold">{order.status}</strong></p>
                <p className="text-stone-600">Total BDT: <strong className="text-stone-950 text-sm">{formatBDT(order.total)}</strong></p>
              </div>
            </div>

            {/* Purchased Items */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 block">
                Purchased Imported Items ({order.items?.length})
              </span>
              <div className="divide-y divide-stone-100">
                {order.items?.map((item, i) => (
                  <div key={i} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                        <ProductImage
                          src={item.image}
                          alt={item.name}
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-stone-900">{item.name}</p>
                        <p className="text-stone-500 text-[11px]">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="font-bold text-stone-950 font-serif">
                      {formatBDT(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Presentation Note */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
              <strong className="block mb-0.5">Order tracking:</strong>
              Use your order reference and checkout phone number on the tracking page. Authorized administrators can manage order status in the <Link href="/admin/orders" className="underline font-bold">Admin Order Panel</Link>.
            </div>
          </div>
        )}

      </main>

      <SiteFooter />
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background p-12 text-center text-sm text-stone-500">Loading order receipt...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
