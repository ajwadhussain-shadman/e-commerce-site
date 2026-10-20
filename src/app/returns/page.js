import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";
import Breadcrumbs from "@/components/common/Breadcrumbs";

export const metadata = {
  title: "Returns & Refund Policy | Importora",
  description: "Learn about our 7-day replacement and refund policy for imported consumer goods in Bangladesh.",
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <Breadcrumbs items={[{ label: "Returns Policy" }]} />

        <div className="py-6 border-b border-stone-200">
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-stone-950">
            Returns & Refund Policy
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Fair and transparent return terms for authentic imported goods.
          </p>
        </div>

        <div className="py-8 space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-base text-stone-950">1. Eligibility for Returns (7 Days)</h3>
            <p>
              We provide a 7-day hassle-free replacement or refund window for any products that arrive damaged, compromised, unsealed, or past their best-before date.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-base text-stone-950">2. Footwear & Sneakers Exchanges</h3>
            <p>
              Imported sneakers may be exchanged for a different size within 7 days, provided the shoes are unworn, clean, and in their original branded presentation box with tags intact.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-base text-stone-950">3. How to Request an Exchange</h3>
            <p>
              Simply message our customer support team on WhatsApp or phone at +880 1700-000000 with your order reference number and a photo of the item. Our courier rider will pick up the item and deliver the replacement.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
