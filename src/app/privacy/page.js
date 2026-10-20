import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";
import Breadcrumbs from "@/components/common/Breadcrumbs";

export const metadata = {
  title: "Privacy Policy | Importora",
  description: "Customer data protection and privacy policy for Importora.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <Breadcrumbs items={[{ label: "Privacy Policy" }]} />

        <div className="py-6 border-b border-stone-200">
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-stone-950">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Last Updated: January 2026 • Your personal information is secure and respected.
          </p>
        </div>

        <div className="py-8 space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-base text-stone-950">1. Information We Collect</h3>
            <p>
              When you place an order on Importora, we collect details necessary to fulfill your parcel: your name, contact phone number, delivery address, and optional email address.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-base text-stone-950">2. How We Use Your Data</h3>
            <p>
              Your contact and address information is used strictly to coordinate delivery with our designated courier partners in Bangladesh and provide order confirmation notifications.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-base text-stone-950">3. Demo Environment Security</h3>
            <p>
              In this client presentation environment, no financial card data or live banking passwords are ever requested or stored.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
