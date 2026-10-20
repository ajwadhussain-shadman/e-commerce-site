const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
let lastCreatedOrder = null;

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "The order request failed");
  return result;
}

export const orderService = {
  async getAllOrders() { return (await request("/orders")).data; },

  async getOrderPage(filters = {}) {
    const params = new URLSearchParams();
    for (const key of ["page", "limit", "status", "search", "from", "to"]) {
      if (filters[key] !== undefined && filters[key] !== "" && filters[key] !== "all") params.set(key, String(filters[key]));
    }
    return request(`/orders?${params}`);
  },

  async getCustomers() { return (await request("/customers")).data; },

  async getMyOrders() { return (await request("/orders/mine")).data; },

  async getOrderById(id) {
    if (lastCreatedOrder?.id === String(id).toUpperCase()) return lastCreatedOrder;
    try { return (await request(`/orders/receipt/${encodeURIComponent(id)}`)).data; }
    catch { return null; }
  },

  async trackOrder(orderId, phone = "") {
    if (!phone.trim()) return null;
    const query = new URLSearchParams({ phone });
    try { return (await request(`/orders/track/${encodeURIComponent(orderId)}?${query}`)).data; }
    catch { return null; }
  },

  async createOrder(orderData) {
    const result = await request("/orders", { method: "POST", body: JSON.stringify(orderData) });
    lastCreatedOrder = result.data;
    return result.data;
  },

  async updateOrderStatus(orderId, newStatus) {
    return (await request(`/orders/${encodeURIComponent(orderId)}/status`, {
      method: "PATCH", body: JSON.stringify({ status: newStatus }),
    })).data;
  },
};
