"use client";

import Link from "next/link";
import { categories } from "@/data/categories";
import { Phone, Mail, MapPin } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { hasAdminRole } from "@/lib/auth-access.mjs";
import Logo from "./Logo";

export default function SiteFooter() {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Category names come from the data file in English; fall back to the
  // dictionary entry for the active language, exactly like the navbar does.
  const catLabel = (cat) => {
    const value = t(`categories.${cat.slug}`);
    return value === `categories.${cat.slug}` ? cat.name : value;
  };

  return (
    <footer className="bg-stone-900 dark:bg-surface text-stone-300 border-t border-stone-800 dark:border-border text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="mb-4">
              <Logo size="lg" className="text-white" />
            </div>

            <p className="text-xs text-stone-400 mb-4 leading-relaxed">
              {t("footer.brandDesc")}
            </p>

            <div className="space-y-2 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{t("footer.address")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <span>{t("footer.phone")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>support@importora-demo.com</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              {t("footer.categoriesTitle")}
            </h4>
            <ul className="space-y-2 text-xs">
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/categories/${cat.slug}`} className="hover:text-white hover:underline transition-colors">
                    {catLabel(cat)}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/products" className="text-orange-500 hover:text-orange-400 hover:underline inline-flex items-center gap-1 font-semibold">
                  {t("footer.viewAllProducts")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              {t("footer.customerCare")}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/track-order" className="hover:text-white hover:underline transition-colors">
                  {t("footer.trackYourOrder")}
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white hover:underline transition-colors">
                  {t("footer.shippingDelivery")}
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white hover:underline transition-colors">
                  {t("footer.returnRefund")}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white hover:underline transition-colors">
                  {t("footer.faq")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white hover:underline transition-colors">
                  {t("footer.contactCare")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              {t("footer.companyLegal")}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-white hover:underline transition-colors">
                  {t("footer.aboutNovella")}
                </Link>
              </li>
              {/* These pointed at /policy/privacy and /policy/terms, neither of
                  which is a route in this app — both 404'd. The pages live at
                  /privacy and /terms. */}
              <li>
                <Link href="/privacy" className="hover:text-white hover:underline transition-colors">
                  {t("footer.privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white hover:underline transition-colors">
                  {t("footer.termsConditions")}
                </Link>
              </li>
              {hasAdminRole(user) && <li>
                <Link href="/admin" className="text-orange-500 hover:text-orange-400 hover:underline font-semibold">
                  {t("footer.adminDashboard")}
                </Link>
              </li>}
            </ul>
          </div>

        </div>

        <div className="border-t border-stone-800 dark:border-border mt-12 pt-8">
          <p className="text-xs text-stone-500">
            © {new Date().getFullYear()} Importora. {t("footer.allRightsReserved")}
          </p>
          <p className="text-[11px] text-stone-600 mt-2">
            {t("footer.demoDisclaimer")}
          </p>
        </div>
      </div>
    </footer>
  );
}
