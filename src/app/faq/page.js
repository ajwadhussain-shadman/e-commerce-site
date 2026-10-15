"use client";

import { useState } from "react";
import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: "Are all products genuinely imported from overseas?",
      a: "Yes, 100%. We specialize exclusively in imported consumer items. Our KitKats and matcha treats originate from Japan and the UK, buldak ramen from South Korea, Quaker oats and Horlicks from the United Kingdom, and sneakers from authentic brand distributors."
    },
    {
      q: "How does Cash on Delivery (COD) work?",
      a: "You can place your order online without prepaying. When the delivery rider arrives at your address with your package, you inspect the outer parcel and hand over the cash amount directly to the courier."
    },
    {
      q: "What is your delivery timeframe inside Dhaka and outside Dhaka?",
      a: "Inside Dhaka: Typically 24 to 48 hours from order confirmation. Outside Dhaka (Chittagong, Sylhet, and all 64 districts): 2 to 4 business days via our partner express couriers."
    },
    {
      q: "How do I qualify for Free Nationwide Delivery?",
      a: "Any order with a subtotal of ৳3,000 or above automatically receives free standard shipping anywhere in Bangladesh!"
    },
    {
      q: "How do you protect chocolates from melting during Dhaka summer transit?",
      a: "Our chocolates are stored in air-conditioned storage and dispatched in thermal bubble wrap with reusable ice chill gel packs to prevent melting during courier transit."
    },
    {
      q: "What is your return and exchange policy?",
      a: "If an item arrives damaged, expired, or incorrect, report it to our customer care within 7 days of delivery for a prompt hassle-free replacement or full refund."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf9]">
      <SiteHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <Breadcrumbs items={[{ label: "Frequently Asked Questions" }]} />

        <div className="py-6 border-b border-stone-200 text-center max-w-xl mx-auto">
          <span className="text-xs uppercase font-bold tracking-widest text-amber-800">
            Help & Guidance
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-stone-950 mt-1">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Everything you need to know about imported goods, delivery, payments, and product freshness.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-stone-900 text-sm hover:text-amber-900 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-amber-800" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
