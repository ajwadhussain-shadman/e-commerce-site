import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";
import Breadcrumbs from "@/components/common/Breadcrumbs";

export const metadata = {
  title: "Terms & Conditions | Importora",
  description: "Terms and conditions of service for imported goods purchases in Bangladesh.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <Breadcrumbs items={[{ label: "Terms & Conditions" }]} />

        <div className="py-6 border-b border-stone-200">
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-stone-950">
            Terms & Conditions
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Standard customer agreement for purchasing imported consumer products.
          </p>
        </div>

        <div className="py-8 space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-base text-stone-950">1. Product Pricing & Currency</h3>
            <p>
              All prices displayed across the Importora storefront are stated in Bangladeshi Taka (BDT / ৳). While we strive for accuracy, in rare cases of technical inventory error, we reserve the right to verify pricing before order dispatch.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-base text-stone-950">2. Parcel Acceptance on Delivery</h3>
            <p>
              For Cash on Delivery orders, customers are invited to inspect parcel condition in the presence of the courier rider before settling the payment invoice.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-base text-stone-950">3. Demonstration Disclaimer</h3>
            <p>
              This website build is created as a presentation and functional prototype demo for a Bangladeshi imported products enterprise.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
