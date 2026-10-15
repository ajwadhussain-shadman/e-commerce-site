"use client";

import { useState } from "react";
import SiteHeader from "./SiteHeader";
import CategoryNavigation from "./CategoryNavigation";
import MobileNavigation from "./MobileNavigation";
import { useScrollDirection } from "@/hooks/useScrollDirection";

/**
 * Single sticky navigation region shared by every storefront route.
 *
 * `showCategories` lets a page opt out of the desktop category rail
 * (e.g. the checkout / auth flow) while keeping everything else identical.
 */
export default function SiteNav({ showCategories = false }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { hidden, atTop } = useScrollDirection({ hideOffset: 40 });

  return (
    <>
      <SiteHeader
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        compact={hidden && !atTop}
      />

      {showCategories && <CategoryNavigation />}
      <MobileNavigation
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
