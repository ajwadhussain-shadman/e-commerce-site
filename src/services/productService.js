import { products as initialProducts } from "@/data/products";
import { categories as initialCategories } from "@/data/categories";

const STORAGE_KEY_PRODUCTS = "novella_demo_products";
const STORAGE_KEY_CATEGORIES = "novella_demo_categories";

// Client-safe storage getter
function getStoredProducts() {
  if (typeof window === "undefined") return initialProducts;
  try {
    const item = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    return item ? JSON.parse(item) : initialProducts;
  } catch {
    return initialProducts;
  }
}

function saveProducts(prods) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(prods));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
  }
}

/**
 * Product Data Access Service
 * Designed to cleanly swap to Express / MongoDB backend (e.g., fetch(`${API_URL}/products`))
 */
export const productService = {
  async getAllProducts(filters = {}) {
    // In future backend: return fetch('/api/products').then(res => res.json())
    let list = [...getStoredProducts()];

    if (filters.category) {
      list = list.filter(p => p.category === filters.category);
    }
    if (filters.subcategory) {
      list = list.filter(p => p.subcategory === filters.subcategory);
    }
    if (filters.brand) {
      list = list.filter(p => p.brand === filters.brand);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.shortDescription?.toLowerCase().includes(q)
      );
    }
    if (filters.minPrice !== undefined && filters.minPrice !== null) {
      list = list.filter(p => (p.discountPrice || p.price) >= filters.minPrice);
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
      list = list.filter(p => (p.discountPrice || p.price) <= filters.maxPrice);
    }
    if (filters.isFeatured) {
      list = list.filter(p => p.isFeatured);
    }
    if (filters.isNewArrival) {
      list = list.filter(p => p.isNewArrival);
    }
    if (filters.isBestSeller) {
      list = list.filter(p => p.isBestSeller);
    }

    // Sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "price-low":
          list.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
          break;
        case "price-high":
          list.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
          break;
        case "rating":
          list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case "newest":
          list.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
          break;
        case "popularity":
        default:
          list.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
          break;
      }
    }

    return list;
  },

  async getProductBySlug(slug) {
    const list = getStoredProducts();
    return list.find(p => p.slug === slug) || null;
  },

  async getProductById(id) {
    const list = getStoredProducts();
    return list.find(p => p.id === id) || null;
  },

  async getRelatedProducts(product, limit = 4) {
    if (!product) return [];
    const list = getStoredProducts();
    return list
      .filter(p => p.id !== product.id && (p.category === product.category || p.brand === product.brand))
      .slice(0, limit);
  },

  async getFeaturedProducts(limit = 8) {
    const list = getStoredProducts();
    return list.filter(p => p.isFeatured).slice(0, limit);
  },

  async getBestSellers(limit = 8) {
    const list = getStoredProducts();
    return list.filter(p => p.isBestSeller).slice(0, limit);
  },

  async getNewArrivals(limit = 8) {
    const list = getStoredProducts();
    return list.filter(p => p.isNewArrival).slice(0, limit);
  },

  // Admin Mutations (Persisted in localStorage for demo)
  async createProduct(newProduct) {
    const list = getStoredProducts();
    const id = `prod-${Date.now()}`;
    const slug = newProduct.slug || newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const product = { ...newProduct, id, slug };
    const updated = [product, ...list];
    saveProducts(updated);
    return product;
  },

  async updateProduct(id, updates) {
    const list = getStoredProducts();
    const index = list.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Product not found");
    list[index] = { ...list[index], ...updates };
    saveProducts(list);
    return list[index];
  },

  async deleteProduct(id) {
    const list = getStoredProducts();
    const updated = list.filter(p => p.id !== id);
    saveProducts(updated);
    return true;
  },

  async resetToDefaults() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY_PRODUCTS);
    }
    return initialProducts;
  }
};

export const categoryService = {
  async getCategories() {
    return initialCategories;
  },

  async getCategoryBySlug(slug) {
    return initialCategories.find(c => c.slug === slug) || null;
  }
};
