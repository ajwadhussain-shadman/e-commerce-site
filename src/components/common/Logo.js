"use client";

import Link from "next/link";
import Image from "next/image";

/** @param {{size?: "sm" | "md" | "lg", className?: string, href?: string}} props */
export default function Logo({ size = "md", className = "", href = "/" }) {
  const sizeClasses = {
    sm: "text-base sm:text-lg",
    md: "text-lg sm:text-xl lg:text-2xl",
    lg: "text-xl sm:text-2xl lg:text-3xl",
  };

  const cartSizeClasses = {
    sm: "h-6 w-6 sm:h-7 sm:w-7",
    md: "h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9",
    lg: "h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10",
  };

  const gapClasses = {
    sm: "gap-1 sm:gap-1.5",
    md: "gap-1.5 sm:gap-2",
    lg: "gap-2 sm:gap-2.5",
  };

  const content = (
    <>
      <span className="font-sans font-semibold tracking-tight text-current">
        IMPORTORA
      </span>
      <Image
        src="/img/shoppingcart.png"
        alt=""
        width={28}
        height={28}
        className={cartSizeClasses[size]}
        aria-hidden="true"
      />
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`inline-flex items-center justify-center ${gapClasses[size]} ${className}`}
        aria-label="Importora - Home"
      >
        {content}
      </Link>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center ${gapClasses[size]} ${className}`}>
      {content}
    </span>
  );
}