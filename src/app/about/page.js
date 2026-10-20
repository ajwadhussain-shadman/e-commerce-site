import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Image from "next/image";
import { ShieldCheck, Globe2, Truck, Award } from "lucide-react";

export const metadata = {
  title: "About Us | Importora Bangladesh",
  description: "Learn about Importora, our curation of imported chocolates, Korean ramen, British oats, and lifestyle footwear.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <Breadcrumbs items={[{ label: "About Us" }]} />

        {/* Hero */}
        <div className="py-8 text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase font-bold tracking-widest text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            Our Brand Story
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-950 mt-3 leading-tight">
            Curating the World&apos;s Finest Consumables for Bangladesh
          </h1>
          <p className="text-sm text-stone-600 mt-4 leading-relaxed">
            Founded with a passion for genuine global products, Importora connects discerning shoppers in Bangladesh with authentic pantry icons, confectionery, skincare, and footwear from the UK, Japan, Korea, Europe, and the United States.
          </p>
        </div>

        {/* Feature Image */}
        <div className="relative aspect-21/9 w-full rounded-3xl overflow-hidden shadow-lg border border-stone-200 mb-12">
          <Image
            src="https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=1200&q=80"
            alt="Importora imported goods collection"
            fill
            className="object-cover"
          />
        </div>

        {/* 4 Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-12">
          <div className="p-6 bg-white rounded-3xl border border-stone-200/90 shadow-xs space-y-2">
            <ShieldCheck className="w-8 h-8 text-amber-700" />
            <h3 className="font-serif font-bold text-base text-stone-900">Direct Batch Sourcing</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Every chocolate bar, noodle bowl, and bottle is procured through established international distributors with verified supply chains.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-stone-200/90 shadow-xs space-y-2">
            <Globe2 className="w-8 h-8 text-emerald-700" />
            <h3 className="font-serif font-bold text-base text-stone-900">Climate-Controlled Care</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Our storage hubs in Dhaka maintain strict temperature controls to prevent heat melting of delicate Swiss chocolates and ensure maximum freshness.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-stone-200/90 shadow-xs space-y-2">
            <Truck className="w-8 h-8 text-blue-700" />
            <h3 className="font-serif font-bold text-base text-stone-900">Nationwide Reach</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Fast 24-48h courier delivery in Dhaka metro and reliable doorstep delivery to all 64 districts in Bangladesh with Cash on Delivery.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-stone-200/90 shadow-xs space-y-2">
            <Award className="w-8 h-8 text-purple-700" />
            <h3 className="font-serif font-bold text-base text-stone-900">Customer Commitment</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              We stand behind every parcel with a friendly 7-day replacement guarantee and live phone support 7 days a week.
            </p>
          </div>
        </div>

        {/* Note */}
        <div className="p-5 bg-stone-100 rounded-2xl text-xs text-stone-500 border border-stone-200">
          <strong className="text-stone-700">Presentation Demo Note:</strong> This page layout contains editable placeholder business information for client presentation and customization.
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
