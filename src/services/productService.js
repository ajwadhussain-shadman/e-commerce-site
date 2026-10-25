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

function filterProducts(list, filters) {
  let result = [...list];
  if (filters.category) result = result.filter((product) => product.category === filters.category);
  if (filters.subcategory) result = result.filter((product) => product.subcategory === filters.subcategory);
  if (filters.brand) result = result.filter((product) => product.brand === filters.brand);
  if (filters.search) {
    const term = filters.search.toLowerCase().trim();
    result = result.filter((product) => product.name?.toLowerCase().includes(term) || product.brand?.toLowerCase().includes(term) || product.shortDescription?.toLowerCase().includes(term));
  }
  if (filters.minPrice != null) result = result.filter((product) => Number(product.discountPrice || product.price) >= Number(filters.minPrice));
  if (filters.maxPrice != null) result = result.filter((product) => Number(product.discountPrice || product.price) <= Number(filters.maxPrice));
  if (filters.isFeatured) result = result.filter((product) => product.isFeatured);
  if (filters.isNewArrival) result = result.filter((product) => product.isNewArrival);
  if (filters.isBestSeller) result = result.filter((product) => product.isBestSeller);
  if (filters.sortBy === "price-low") result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
  else if (filters.sortBy === "price-high") result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
  else if (filters.sortBy === "rating") result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else if (filters.sortBy === "newest") result.sort((a, b) => Number(Boolean(b.isNewArrival)) - Number(Boolean(a.isNewArrival)));
  else if (filters.sortBy === "popularity") result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
  return result;
}

export const productService = {
  async getAllProducts(filters = {}) {
    const params = new URLSearchParams();
    for (const key of ["category", "subcategory", "brand", "search", "minPrice", "maxPrice", "sortBy"]) {
      if (filters[key] !== undefined && filters[key] !== "") params.set(key, String(filters[key]));
    }
    for (const key of ["isFeatured", "isNewArrival", "isBestSeller"]) if (filters[key]) params.set(key, "true");
    const result = await request(`/products${params.size ? `?${params}` : ""}`);
    return filterProducts(result.data, filters);
  },

  async getProductBySlug(slug) {
    try { return (await request(`/products/${encodeURIComponent(slug)}`)).data; }
    catch (error) {
      if (error.message === "Product not found") return null;
      throw error;
    }
  },

  async getProductById(id) { return (await request(`/products/id/${encodeURIComponent(id)}`)).data; },

  async getAdminProducts() { return (await request("/admin/products")).data; },
  async getAdminProduct(id) { return (await request(`/admin/products/${encodeURIComponent(id)}`)).data; },

  async getAdminProductPage(filters = {}) {
    const params = new URLSearchParams();
    for (const key of ["page", "limit", "search", "category", "status", "sort"]) {
      if (filters[key] !== undefined && filters[key] !== "") params.set(key, String(filters[key]));
    }
    return request(`/admin/products?${params}`);
  },

  async uploadProductImages(files) {
    const selectedFiles = [...files];
    if (!selectedFiles.length || selectedFiles.length > 20 || selectedFiles.some((file) => !new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]).has(file.type) || !Number.isSafeInteger(file.size) || file.size < 1 || file.size > 10 * 1024 * 1024)) {
      throw new Error("Choose 1 to 20 JPG, PNG, WebP or AVIF images up to 10 MB each.");
    }
    const body = new FormData();
    for (const file of selectedFiles) body.append("images", file);
    const response = await fetch(`${API_BASE}/admin/images/upload`, { method: "POST", credentials: "include", body });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(result.data) || result.data.length !== selectedFiles.length || result.data.some((asset) => !asset?.url || !asset?.publicId)) throw new Error(result.message || "Image upload failed");
    return result.data;
  },

  async uploadProductImage(file) {
    return (await this.uploadProductImages([file]))[0];
  },

  async deleteProductImage(publicId) {
    return request("/admin/images/destroy", { method: "POST", body: JSON.stringify({ publicId }) });
  },

  async getAdminMetrics() { return (await request("/admin/metrics")).data; },

  async getRelatedProducts(product, limit = 4) {
    if (!product) return [];
    return (await this.getAllProducts()).filter((item) => item.id !== product.id && (item.category === product.category || item.brand === product.brand)).slice(0, limit);
  },

  async getFeaturedProducts(limit = 8) { return (await this.getAllProducts({ isFeatured: true })).slice(0, limit); },
  async getBestSellers(limit = 8) { return (await this.getAllProducts({ isBestSeller: true })).slice(0, limit); },
  async getNewArrivals(limit = 8) { return (await this.getAllProducts({ isNewArrival: true })).slice(0, limit); },

  async createProduct(product) {
    return (await request("/products", { method: "POST", body: JSON.stringify(product) })).data;
  },
  async updateProduct(id, updates) {
    return (await request(`/products/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(updates) })).data;
  },
  async deleteProduct(id) {
    return (await request(`/products/${encodeURIComponent(id)}`, { method: "DELETE" }));
  },
  async resetToDefaults() {
    throw new Error("Bulk catalog reset is disabled. Use the reviewed insert-only catalog import command instead.");
  },
};

export const categoryService = {
  async getCategories() {
    return (await request("/categories")).data;
  },
  async getCategoryBySlug(slug) { return (await this.getCategories()).find((category) => category.slug === slug) || null; },
  async createCategory(category) { return (await request("/categories", { method: "POST", body: JSON.stringify(category) })).data; },
  async updateCategory(slug, category) { return (await request(`/categories/${encodeURIComponent(slug)}`, { method: "PUT", body: JSON.stringify(category) })).data; },
  async deleteCategory(slug) { await request(`/categories/${encodeURIComponent(slug)}`, { method: "DELETE" }); },
  async uploadCategoryImage(file) {
    if (!file || !new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]).has(file.type) || !Number.isSafeInteger(file.size) || file.size < 1 || file.size > 10 * 1024 * 1024) {
      throw new Error("Choose a JPG, PNG, WebP or AVIF image up to 10 MB.");
    }
    const body = new FormData();
    body.append("image", file);
    const response = await fetch(`${API_BASE}/admin/categories/upload-image`, { method: "POST", credentials: "include", body });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.data?.url) throw new Error(result.message || "Image upload failed");
    return result.data;
  },
};

export const reviewService = {
  async getProductReviews(slug, page = 1) { return request(`/products/${encodeURIComponent(slug)}/reviews?page=${page}&limit=10`); },
  async getMyProductReview(productId) { return (await request(`/reviews/mine?productId=${encodeURIComponent(productId)}`)).data; },
  async submitReview(review) { return request("/reviews", { method: "POST", body: JSON.stringify(review) }); },
  async updateReview(reviewId, review) { return request(`/reviews/${encodeURIComponent(reviewId)}`, { method: "PUT", body: JSON.stringify(review) }); },
  async getAdminReviews(status = "", page = 1) {
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (status) params.set("status", status);
    return request(`/admin/reviews?${params}`);
  },
  async moderate(reviewId, status) {
    return request(`/admin/reviews/${encodeURIComponent(reviewId)}`, { method: "PATCH", body: JSON.stringify({ status }) });
  },
  async setFeatured(reviewId, featured) {
    return request(`/admin/reviews/${encodeURIComponent(reviewId)}/featured`, { method: "PATCH", body: JSON.stringify({ featured }) });
  },
  async getFeaturedReviews(limit = 10) {
    return (await request(`/reviews/featured?limit=${limit}`)).data;
  },
};

export const couponService = {
  async getActiveCoupons() {
    try {
      const res = await request("/coupons/active");
      return res.data || [];
    } catch {
      return [];
    }
  },
  async validateCoupon(code, subtotal) {
    return request("/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code, subtotal }),
    });
  },
  async getAdminCoupons(search = "") {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    return (await request(`/admin/coupons${params.size ? `?${params}` : ""}`)).data || [];
  },
  async createCoupon(data) {
    return (await request("/admin/coupons", {
      method: "POST",
      body: JSON.stringify(data),
    })).data;
  },
  async updateCoupon(id, data) {
    return (await request(`/admin/coupons/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })).data;
  },
  async toggleApproval(id, isApproved) {
    return request(`/admin/coupons/${encodeURIComponent(id)}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ isApproved }),
    });
  },
  async toggleStatus(id, isActive) {
    return request(`/admin/coupons/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  },
  async deleteCoupon(id) {
    return request(`/admin/coupons/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};

export const discountService = {
  async getDiscountRules() {
    return (await request("/admin/discount-rules")).data || [];
  },
  async applyDiscount(data) {
    return request("/admin/discounts/apply", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async removeDiscountRule(id, revert = true) {
    return request(`/admin/discount-rules/${encodeURIComponent(id)}?revert=${revert}`, {
      method: "DELETE",
    });
  },
};
