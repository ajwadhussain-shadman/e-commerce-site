"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { orderService } from "@/services/orderService";
import { 
  Package, 
  Search, 
  CheckCircle2, 
  Clock, 
  Truck, 
  MapPin, 
  AlertCircle,
  HelpCircle
} from "lucide-react";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("id") || "";

  const [orderIdInput, setOrderIdInput] = useState(initialOrderId || "NOV-84920");
  const [phoneInput, setPhoneInput] = useState("");
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (initialOrderId) {
      handleTrack(initialOrderId);
    } else {
      // Auto-preview sample demo order on load for client demo
      handleTrack("NOV-84920");
    }
  }, [initialOrderId]);

  const handleTrack = async (idToSearch) => {
    const id = idToSearch || orderIdInput;
    if (!id.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    const result = await orderService.trackOrder(id, phoneInput);
    setTrackedOrder(result);
    setIsSearching(false);
  };

  const steps = [
    { title: "Order Placed", desc: "Received via storefront checkout" },
    { title: "Confirmed", desc: "Customer details and phone verified" },
    { title: "Processing", desc: "Carefully packed with protective bubble wrap" },
    { title: "Shipped", desc: "Dispatched with express courier rider" },
    { title: "Delivered", desc: "Handed over to customer at destination" }
  ];

  const getStepStatus = (stepTitle, currentStatus) => {
    const statusHierarchy = {
      "Pending": 1,
      "Confirmed": 2,
      "Processing": 3,
      "Shipped": 4,
      "Delivered": 5
    };

    const currentLevel = statusHierarchy[currentStatus] || 1;
    const stepLevel = statusHierarchy[stepTitle] || 1;

    if (currentLevel > stepLevel) return "completed";
    if (currentLevel === stepLevel) return "active";
    return "upcoming";
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf9]">
      <SiteHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Breadcrumbs items={[{ label: "Order Tracking" }]} />

        {/* Page Header */}
        <div className="py-6 border-b border-stone-200 text-center max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-800 flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950">
            Track Imported Order
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Enter your order reference code (e.g. <strong className="text-stone-800 font-mono">NOV-84920</strong>) to view real-time package progression.
          </p>
        </div>

        {/* Tracking Input Card */}
        <div className="mt-8 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-sm max-w-2xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Order ID / Reference Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NOV-84920"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono uppercase focus:outline-hidden focus:border-amber-700"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Phone Number (Optional verification)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 01712345678"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-amber-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-3 bg-stone-950 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Search className="w-4 h-4 text-amber-300" />
              <span>{isSearching ? "Searching Tracking Status..." : "Track Package Status"}</span>
            </button>
          </form>

          {/* Preset Demo Order Links for Instant Client Testing */}
          <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
            <span>Demo sample references:</span>
            {["NOV-84920", "NOV-84921", "NOV-84922", "NOV-84923"].map((ref) => (
              <button
                key={ref}
                type="button"
                onClick={() => {
                  setOrderIdInput(ref);
                  handleTrack(ref);
                }}
                className="px-2 py-0.5 bg-stone-100 hover:bg-amber-100 text-stone-800 rounded font-mono font-medium transition-colors"
              >
                {ref}
              </button>
            ))}
          </div>
        </div>

        {/* Tracking Timeline Output */}
        {trackedOrder ? (
          <div className="mt-10 bg-white p-6 sm:p-10 rounded-3xl border border-stone-200/90 shadow-md space-y-8 animate-fade-in">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-200 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                  Status: {trackedOrder.status}
                </span>
                <h2 className="text-xl font-serif font-bold text-stone-950 mt-2">
                  Order #{trackedOrder.id}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Placed by {trackedOrder.customer?.fullName} • Destination: {trackedOrder.customer?.district}
                </p>
              </div>

              <div className="text-right self-start sm:self-auto">
                <span className="text-xs text-stone-500">Total BDT</span>
                <div className="text-xl font-bold text-stone-950 font-serif">
                  ৳{trackedOrder.total}
                </div>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="relative pl-6 sm:pl-8 border-l-2 border-stone-200 ml-4 space-y-8">
              {steps.map((step, index) => {
                const state = getStepStatus(step.title, trackedOrder.status);
                const historyEntry = trackedOrder.history?.find(h => h.status === step.title);

                return (
                  <div key={index} className="relative group">
                    {/* Circle icon */}
                    <div className={`absolute -left-[35px] sm:-left-[43px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      state === "completed"
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : state === "active"
                        ? "bg-amber-500 border-amber-500 text-stone-950 animate-pulse"
                        : "bg-white border-stone-300 text-stone-300"
                    }`}>
                      {state === "completed" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : state === "active" ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </div>

                    {/* Step details */}
                    <div>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h4 className={`text-sm font-bold ${
                          state === "upcoming" ? "text-stone-400" : "text-stone-950"
                        }`}>
                          {step.title}
                        </h4>
                        {historyEntry && (
                          <span className="text-[11px] font-mono text-stone-400">
                            • {historyEntry.time}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${
                        state === "upcoming" ? "text-stone-400" : "text-stone-600"
                      }`}>
                        {historyEntry?.note || step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Disclaimer */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-500">
              <span className="font-semibold text-stone-700">Client Demo Note:</span> Statuses reflect local mock order progression. To advance this order to Shipped or Delivered, update it in the <a href="/admin/orders" className="underline font-bold text-amber-900">Admin Orders Tab</a>.
            </div>

          </div>
        ) : (
          hasSearched && (
            <div className="mt-8 bg-white p-8 rounded-3xl border border-stone-200 text-center max-w-md mx-auto">
              <AlertCircle className="w-10 h-10 text-stone-400 mx-auto mb-2" />
              <h3 className="font-serif font-bold text-base text-stone-900">Order Not Found</h3>
              <p className="text-xs text-stone-500 mt-1">
                We couldn&apos;t find an order matching reference &ldquo;{orderIdInput}&rdquo;. Try one of the demo references: NOV-84920, NOV-84921, NOV-84922, NOV-84923.
              </p>
            </div>
          )
        )}

      </main>

      <SiteFooter />
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fcfbf9] p-12 text-center text-sm text-stone-500">Loading order tracker...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
