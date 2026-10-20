"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

/**
 * Product image with a consistent fallback for missing or broken sources.
 * The parent element must be positioned (the image always uses `fill`).
 */
export default function ProductImage({
  src,
  alt = "",
  className = "object-contain",
  sizes,
  preload = false,
  unoptimized = false,
  ...props
}) {
  const [failedSrc, setFailedSrc] = useState(null);
  const usableSrc = typeof src === "string" ? src.trim() : "";
  const isRenderable = usableSrc.startsWith("/") || /^https?:\/\//i.test(usableSrc);
  const failed = isRenderable && failedSrc === usableSrc;
  // next/image only optimizes https sources configured in next.config. Local
  // paths and plain-http images are rendered directly so a valid legacy URL
  // cannot crash the page on an image-loader configuration error.
  const bypassOptimization = unoptimized || !usableSrc.startsWith("https://");

  if (!isRenderable || failed) {
    return (
      <div
        role="img"
        aria-label={`${alt || "Product"} image unavailable`}
        className="absolute inset-0 flex items-center justify-center bg-surface-muted text-muted-foreground"
      >
        <ImageOff className="h-8 w-8 opacity-50" aria-hidden="true" />
      </div>
    );
  }

  return (
    <Image
      src={usableSrc}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      unoptimized={bypassOptimization}
      className={className}
      onError={() => setFailedSrc(usableSrc)}
      {...props}
    />
  );
}
