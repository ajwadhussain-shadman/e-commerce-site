import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { Truck, ShieldCheck, MapPin, Clock } from "lucide-react";

export const metadata = {
  title: "Shipping & Delivery Policy | Importora",
  description: "Learn about delivery charges, express timeframes, and parcel handling in Bangladesh.",
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <Breadcrumbs items={[{ label: "Shipping Policy" }]} />

        <div className="py-6 border-b border-stone-200">
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-stone-950">
            Shipping & Delivery Policy
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Carefully packaged imported goods delivered across Dhaka and all 64 districts in Bangladesh.
          </p>
        </div>

        <div className="py-8 space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-base text-stone-950">1. Delivery Zones & Standard Rates</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Inside Dhaka Metro:</strong> ৳120 regular shipping fee. Delivery takes 24 to 48 business hours.</li>
              <li><strong>Outside Dhaka (All 64 Districts):</strong> ৳180 regular shipping fee. Delivery takes 2 to 4 business days.</li>
              <li><strong>Free Shipping Threshold:</strong> Every order containing <strong>৳3,000</strong> or more in merchandise receives 100% Free Delivery automatically.</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-base text-stone-950">2. Fragile & Temperature-Sensitive Packaging</h3>
            <p>
              Imported chocolates, glass sauce jars, and health malt tubs are packed using double-layer industrial bubble wrap. During warmer weather in Bangladesh, chocolate shipments include thermal insulating wrap and reusable ice packs to prevent heat deformation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-base text-stone-950">3. Order Tracking</h3>
            <p>
              Once your order has been dispatched from our Dhaka distribution hub, you can trace your parcel in real-time by entering your order reference (e.g. NOV-84920) on our <a href="/track-order" className="text-amber-800 underline font-semibold">Track Order page</a>.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
