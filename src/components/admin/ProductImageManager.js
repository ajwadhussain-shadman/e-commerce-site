"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, RefreshCw, Star, Trash2, UploadCloud } from "lucide-react";
import ProductImage from "@/components/products/ProductImage";
import { productService } from "@/services/productService";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGES = 20;

function isValidImageUrl(value) {
  if (typeof value !== "string" || !value.trim() || value.length > 2048) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Ordered multi-image editor used by the Add and Edit product forms.
 *
 * `items` is an ordered array of `{ url, publicId }`. The first item is the
 * primary storefront image. Uploaded assets are persisted when the product is
 * saved; removed Cloudinary assets are cleaned up by the API only after a
 * successful save, so a failed save never destroys images still in use.
 */
export default function ProductImageManager({
  items = [],
  onChange,
  onBusyChange,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const replaceIndexRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [urlInput, setUrlInput] = useState("");

  const busy = disabled || uploading;

  const update = (nextItems) => {
    setError("");
    setNotice("");
    onChange?.(nextItems);
  };

  const setBusy = (value) => {
    setUploading(value);
    onBusyChange?.(value);
  };

  const handleFiles = async (fileList) => {
    const files = [...(fileList || [])];
    if (inputRef.current) inputRef.current.value = "";
    if (!files.length) return;
    setError("");
    setNotice("");

    if (!items.length && files.length > MAX_IMAGES) {
      setError(`Choose at most ${MAX_IMAGES} product images.`);
      return;
    }
    if (items.length + files.length > MAX_IMAGES) {
      setError(`A product can have at most ${MAX_IMAGES} images. Remove some before uploading more.`);
      return;
    }
    const invalidFile = files.find((file) => !ACCEPTED_TYPES.has(file.type) || file.size < 1 || file.size > MAX_IMAGE_BYTES);
    if (invalidFile) {
      setError(`"${invalidFile.name}" is not a JPG, PNG, WebP or AVIF image up to 10 MB.`);
      return;
    }

    setBusy(true);
    try {
      const uploaded = await productService.uploadProductImages(files);
      const nextItems = [
        ...items,
        ...uploaded.map((asset) => ({ url: asset.url, publicId: asset.publicId })),
      ];
      onChange?.(nextItems);
      setNotice(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded. Save the product to keep them.`);
    } catch (uploadError) {
      setError(uploadError.message || "Image upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const startReplace = (index) => {
    if (busy) return;
    replaceIndexRef.current = index;
    if (replaceInputRef.current) {
      replaceInputRef.current.value = "";
      replaceInputRef.current.click();
    }
  };

  const handleReplaceFiles = async (fileList) => {
    const file = [...(fileList || [])][0];
    const index = replaceIndexRef.current;
    replaceIndexRef.current = null;
    if (replaceInputRef.current) replaceInputRef.current.value = "";
    if (!file || index === null) return;
    if (!ACCEPTED_TYPES.has(file.type) || file.size < 1 || file.size > MAX_IMAGE_BYTES) {
      setError(`"${file.name}" is not a JPG, PNG, WebP or AVIF image up to 10 MB.`);
      return;
    }

    setError("");
    setNotice("");
    setBusy(true);
    try {
      const [asset] = await productService.uploadProductImages([file]);
      const nextItems = items.map((item, itemIndex) =>
        itemIndex === index ? { url: asset.url, publicId: asset.publicId } : item
      );
      onChange?.(nextItems);
      setNotice("Image replaced. The old stored asset is deleted only after you save this product.");
    } catch (uploadError) {
      setError(uploadError.message || "Image replacement failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const removeItem = (index) => {
    if (busy) return;
    const removed = items[index];
    update(items.filter((_item, itemIndex) => itemIndex !== index));
    if (removed?.publicId) {
      setNotice("Image removed. The stored asset is deleted only after you save this product.");
    }
  };

  const moveItem = (index, direction) => {
    if (busy) return;
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const nextItems = [...items];
    [nextItems[index], nextItems[target]] = [nextItems[target], nextItems[index]];
    update(nextItems);
  };

  const addUrl = () => {
    if (busy) return;
    const url = urlInput.trim();
    if (!url) return;
    if (items.length >= MAX_IMAGES) {
      setError(`A product can have at most ${MAX_IMAGES} images.`);
      return;
    }
    if (!isValidImageUrl(url)) {
      setError("Enter a valid HTTP(S) image URL or an absolute local path.");
      return;
    }
    if (items.some((item) => item.url === url)) {
      setError("That image is already in the product gallery.");
      return;
    }
    update([...items, { url, publicId: null }]);
    setUrlInput("");
  };

  return (
    <section className="space-y-3" aria-labelledby="product-images-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id="product-images-heading" className="font-semibold text-stone-700">
            Product images *
          </h2>
          <p className="mt-0.5 text-[11px] text-stone-500">
            Select multiple files from your computer. The first image is the primary image used in cards and search.
          </p>
        </div>
        <span className="text-[11px] font-mono text-stone-500">{items.length} / {MAX_IMAGES}</span>
      </div>

      {items.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, index) => (
            <li key={item.publicId || item.url || index} className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
              <div className="relative aspect-square bg-stone-100">
                <ProductImage
                  src={item.url}
                  alt={`Product image ${index + 1} preview`}
                  sizes="(max-width: 640px) 50vw, 200px"
                  unoptimized
                />
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-stone-900/85 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {index === 0 ? <Star className="h-2.5 w-2.5 fill-amber-300 text-amber-300" aria-hidden="true" /> : null}
                  {index === 0 ? "Primary" : index + 1}
                </span>
                {item.publicId ? (
                  <span className="absolute right-2 top-2 rounded bg-emerald-700/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    Cloudinary
                  </span>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-1 border-t border-stone-100 p-1.5">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(index, -1)}
                    disabled={busy || index === 0}
                    aria-label={`Move image ${index + 1} earlier`}
                    title="Move earlier"
                    className="rounded-lg p-1.5 text-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 1)}
                    disabled={busy || index === items.length - 1}
                    aria-label={`Move image ${index + 1} later`}
                    title="Move later"
                    className="rounded-lg p-1.5 text-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => startReplace(index)}
                    disabled={busy}
                    aria-label={`Replace image ${index + 1}`}
                    title="Replace image"
                    className="rounded-lg p-1.5 text-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={busy}
                    aria-label={`Remove image ${index + 1}`}
                    title="Remove image"
                    className="rounded-lg p-1.5 text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center">
          <ImagePlus className="mx-auto h-7 w-7 text-stone-400" aria-hidden="true" />
          <p className="mt-2 text-xs font-semibold text-stone-700">No product images yet</p>
          <p className="mt-1 text-[11px] text-stone-500">Select at least one image before saving this product.</p>
        </div>
      )}

      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        disabled={busy}
        className="sr-only"
        onChange={(event) => handleReplaceFiles(event.target.files)}
      />

      {error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-[11px] text-rose-800">{error}</p> : null}
      {notice ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-[11px] text-emerald-800">{notice}</p> : null}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50/70 p-3">
        <label
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-colors ${
            busy || items.length >= MAX_IMAGES ? "cursor-not-allowed bg-stone-400" : "cursor-pointer bg-stone-900 hover:bg-stone-800"
          }`}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="h-4 w-4" aria-hidden="true" />}
          {uploading ? "Uploading…" : "Select images from computer"}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={busy || items.length >= MAX_IMAGES}
            className="sr-only"
            onChange={(event) => handleFiles(event.target.files)}
          />
        </label>
        <p className="text-[11px] text-stone-500">JPG, PNG, WebP or AVIF · up to 10 MB each · max {MAX_IMAGES} images</p>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-stone-200 p-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-[11px] font-semibold text-stone-700">
          Add an image by URL (optional)
          <input
            type="url"
            value={urlInput}
            disabled={busy}
            onChange={(event) => setUrlInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addUrl();
              }
            }}
            placeholder="https://example.com/product.jpg"
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-2.5 font-mono text-xs font-normal disabled:opacity-60"
          />
        </label>
        <button
          type="button"
          onClick={addUrl}
          disabled={busy || !urlInput.trim()}
          className="rounded-xl border border-stone-300 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add URL
        </button>
      </div>

      <p className="text-[10px] text-stone-500">
        Uploaded images are stored by Cloudinary. Removing an existing image does not delete the stored asset until the product save succeeds.
      </p>
    </section>
  );
}
