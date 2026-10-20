"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Upload, Save, Trash2, Edit, Eye, EyeOff, GripVertical, X, ChevronUp, ChevronDown } from "lucide-react";
import { bannerService } from "@/services/bannerService";
import { useToast } from "@/context/ToastContext";
import ConfirmationModal from "@/components/common/ConfirmationModal";

const emptyBanner = { title: "", image: "", isActive: true };

export default function AdminBannersPage() {
  const { addToast } = useToast();
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(null);
  const [originalId, setOriginalId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bannerService.getBanners(false);
      setBanners(data);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Could not load banners.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    bannerService.getBanners(false)
      .then((data) => { if (active) { setBanners(data); setError(""); } })
      .catch((loadError) => { if (active) setError(loadError.message || "Could not load banners."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const edit = (banner) => {
    setOriginalId(banner?.id || "");
    setForm(banner ? { ...banner } : { ...emptyBanner });
    setPreviewFiles([]);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const validFiles = files.filter((file) => new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]).has(file.type) && file.size <= 10 * 1024 * 1024);
    if (validFiles.length !== files.length) {
      addToast("Some files were rejected. Only JPG, PNG, WebP, AVIF up to 10 MB each.", "error");
    }
    setPreviewFiles((prev) => [...prev, ...validFiles].slice(0, 10));
  };

  const removePreviewFile = (index) => {
    setPreviewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleImageChange({ target: { files: e.dataTransfer.files } });
    }
  };

  const uploadImagesAndSave = async (event) => {
    event.preventDefault();
    if (!form?.title?.trim()) {
      addToast("Banner name is required.", "error");
      return;
    }
    if (!previewFiles.length && !form?.image?.trim()) {
      addToast("Please select at least one image.", "error");
      return;
    }

    setSaving(true);
    try {
      let assets = [];
      if (previewFiles.length > 0) {
        setUploading(true);
        setUploadProgress(0);
        assets = await bannerService.uploadBannerImages(previewFiles);
        setUploadProgress(100);
        setUploading(false);
      }

      if (originalId) {
        const payload = {
          title: form.title,
          image: assets.length > 0 ? assets[0].url : form.image,
          imageAssets: assets.length > 0 ? assets : (form.imageAssets || []),
          isActive: form.isActive,
        };
        await bannerService.updateBanner(originalId, payload);
        addToast("Banner updated.", "success");
      } else {
        const baseTitle = form.title.trim();
        const totalItems = assets.length > 0 ? assets.length : 1;
        for (let i = 0; i < totalItems; i++) {
          const itemTitle = totalItems > 1 ? `${baseTitle} ${i + 1}` : baseTitle;
          const asset = assets[i];
          const payload = {
            title: itemTitle,
            image: asset ? asset.url : form.image,
            imageAssets: asset ? [asset] : [],
            isActive: form.isActive,
            order: banners.length + i,
          };
          await bannerService.createBanner(payload);
        }
        addToast(totalItems > 1 ? `Created ${totalItems} banners successfully.` : "Banner created.", "success");
      }

      setForm(null);
      setOriginalId("");
      setPreviewFiles([]);
      await load();
    } catch (saveError) {
      addToast(saveError.message || "Could not save banner(s).", "error");
    } finally {
      setSaving(false);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = (banner) => {
    setBannerToDelete(banner);
  };

  const handleConfirmDelete = async () => {
    if (!bannerToDelete) return;
    try {
      await bannerService.deleteBanner(bannerToDelete.id);
      addToast("Banner deleted.", "success");
      setBannerToDelete(null);
      await load();
    } catch (deleteError) {
      addToast(deleteError.message || "Could not delete banner.", "error");
    }
  };

  const handleReorder = async (direction, index) => {
    const newOrder = [...banners];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newOrder.length) return;
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    const bannerIds = newOrder.map((b) => b.id);
    try {
      await bannerService.reorderBanners(bannerIds);
      addToast("Order updated.", "success");
      await load();
    } catch (error) {
      addToast(error.message || "Could not reorder banners.", "error");
    }
  };

  const toggleActive = async (banner) => {
    try {
      await bannerService.updateBanner(banner.id, { isActive: !banner.isActive });
      addToast(banner.isActive ? "Banner disabled." : "Banner enabled.", "success");
      await load();
    } catch (error) {
      addToast(error.message || "Could not update banner.", "error");
    }
  };

  const moveToTop = async (index) => {
    if (index <= 0) return;
    await handleReorder(-index, index);
  };

  const moveToBottom = async (index) => {
    if (index >= banners.length - 1) return;
    await handleReorder(banners.length - 1 - index, index);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col justify-between gap-4 border-b border-stone-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-950">Banner Management</h1>
          <p className="mt-0.5 text-xs text-stone-500">Manage homepage banner slideshow. Upload images, set titles, links, and ordering.</p>
        </div>
        <button onClick={() => edit(null)} className="inline-flex items-center gap-2 self-start rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white"><Upload className="h-4 w-4" /> Add Banner</button>
      </div>

      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}

      {form && (
        <form onSubmit={uploadImagesAndSave} className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
          <h2 className="text-base font-bold sm:col-span-2 lg:col-span-3">{originalId ? "Edit banner" : "New banner"}</h2>

          <label className="text-xs font-semibold">Title <span className="text-rose-500">*</span>
            <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Banner title" className="mt-1 w-full rounded-xl border border-stone-300 bg-stone-50 p-2.5" />
          </label>

          <label className="text-xs font-semibold sm:col-span-2 lg:col-span-2">Image <span className="text-rose-500">*</span>
            <div className="mt-2">
              {previewFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {previewFiles.map((file, i) => (
                    <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden bg-stone-100">
                      <Image src={URL.createObjectURL(file)} alt={`Preview ${i + 1}`} fill className="object-cover" />
                      <button type="button" onClick={() => removePreviewFile(i)} className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              {form.image && !previewFiles.length && (
                <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-stone-100 mb-2">
                  <Image src={form.image} alt="Current" fill className="object-cover" />
                </div>
              )}
              <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${dragActive ? "border-amber-500 bg-amber-50" : "border-stone-300 hover:border-amber-500"}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={handleImageChange} className="sr-only" id="banner-image-upload" ref={(el) => { if (el) el.multiple = true; }} />
                <label htmlFor="banner-image-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-8 w-8 text-stone-400" />
                  <p className="mt-2 text-sm text-stone-600">Drag & drop or click to select images</p>
                </label>
              </div>
              {uploading && (
                <div className="mt-2">
                  <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-stone-500 text-center">Uploading... {uploadProgress}%</p>
                </div>
              )}
              {!uploading && previewFiles.length > 0 && (
                <button type="submit" className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-stone-800">
                  <Upload className="h-3.5 w-3.5" /> Upload & Save
                </button>
              )}
            </div>
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold self-end">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-stone-300 text-amber-600 focus:ring-amber-500" />
            Active
          </label>

          <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-3">
            <button type="button" onClick={() => { setForm(null); setOriginalId(""); setPreviewFiles([]); }} className="inline-flex items-center gap-1 rounded-xl border border-stone-300 px-4 py-2 text-xs font-semibold"><X className="h-3.5 w-3.5" /> Cancel</button>
            {!previewFiles.length && <button type="submit" disabled={saving || uploading} className="inline-flex items-center gap-1 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white"><Save className="h-3.5 w-3.5" />{saving ? "Saving..." : "Save"}</button>}
          </div>
        </form>
      )}

      {loading ? <p role="status" className="py-10 text-center text-sm text-stone-500">Loading banners...</p> : banners.length === 0 ? <p className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">No banners yet. Add your first banner above.</p> : (
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-stone-50 text-[10px] uppercase text-stone-500">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3">Preview</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {banners.map((banner, index) => (
                  <tr key={banner.id} className="align-middle">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <button onClick={() => moveToTop(index)} title="Move to top" className="p-1 text-stone-400 hover:text-amber-600 rounded" disabled={index === 0}><ChevronUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleReorder(-1, index)} title="Move up" className="p-1 text-stone-400 hover:text-amber-600 rounded" disabled={index === 0}><ChevronUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleReorder(1, index)} title="Move down" className="p-1 text-stone-400 hover:text-amber-600 rounded" disabled={index === banners.length - 1}><ChevronDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => moveToBottom(index)} title="Move to bottom" className="p-1 text-stone-400 hover:text-amber-600 rounded" disabled={index === banners.length - 1}><ChevronDown className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-stone-100">
                        <Image src={banner.image} alt={banner.title} fill className="object-cover" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-stone-900">{banner.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${banner.isActive ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-700"}`}>
                        {banner.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {banner.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleActive(banner)} className="p-2 rounded-lg border border-stone-300 hover:border-amber-500 hover:text-amber-700 transition-colors" title={banner.isActive ? "Deactivate" : "Activate"}>{banner.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
                        <button onClick={() => edit(banner)} className="p-2 rounded-lg border border-stone-300 hover:border-amber-500 hover:text-amber-700 transition-colors" title="Edit"><Edit className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(banner)} className="p-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Banner Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(bannerToDelete)}
        onClose={() => setBannerToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete “${bannerToDelete?.title || "Banner"}”?`}
        message={`Are you sure you want to delete “${bannerToDelete?.title || "this banner"}”? This action cannot be undone.`}
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}