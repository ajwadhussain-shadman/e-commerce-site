/**
 * Normalize product image data coming from the API.
 *
 * Current products persist `images` as an ordered array. Older products may
 * only have the legacy `image` string, so storefront components use these
 * helpers instead of reading `product.images[0]` directly.
 */

export function getProductImages(product) {
  const images = Array.isArray(product?.images)
    ? product.images.map((image) => (typeof image === "string" ? image.trim() : "")).filter(Boolean)
    : [];
  if (!images.length && typeof product?.image === "string" && product.image.trim()) {
    images.push(product.image.trim());
  }
  return [...new Set(images)];
}

export function getPrimaryImage(product) {
  return getProductImages(product)[0] || "";
}
