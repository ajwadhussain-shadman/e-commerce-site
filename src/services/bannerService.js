const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "The API request failed");
  return result;
}

export const bannerService = {
  async getBanners(activeOnly = false) {
    const params = activeOnly ? "?active=true" : "";
    return (await request(`/banners${params}`)).data;
  },

  async getBannerById(id) {
    return (await request(`/banners/${encodeURIComponent(id)}`)).data;
  },

  async createBanner(banner) {
    return (await request("/banners", { method: "POST", body: JSON.stringify(banner) })).data;
  },

  async updateBanner(id, updates) {
    return (await request(`/banners/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(updates) })).data;
  },

  async deleteBanner(id) {
    return await request(`/banners/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  async reorderBanners(bannerIds) {
    return await request("/banners/reorder", { method: "POST", body: JSON.stringify({ bannerIds }) });
  },

  async uploadBannerImages(files) {
    const selectedFiles = [...files];
    if (!selectedFiles.length || selectedFiles.length > 10 || selectedFiles.some((file) => !new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]).has(file.type) || !Number.isSafeInteger(file.size) || file.size < 1 || file.size > 10 * 1024 * 1024)) {
      throw new Error("Choose 1 to 10 JPG, PNG, WebP or AVIF images up to 10 MB each.");
    }
    const body = new FormData();
    for (const file of selectedFiles) body.append("images", file);
    const response = await fetch(`${API_BASE}/banners/upload`, { method: "POST", credentials: "include", body });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(result.data) || result.data.length !== selectedFiles.length || result.data.some((asset) => !asset?.url || !asset?.publicId)) throw new Error(result.message || "Image upload failed");
    return result.data;
  },
};