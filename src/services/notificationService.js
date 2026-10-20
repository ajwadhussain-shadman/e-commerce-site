const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      const message = result.message || new Error(response.statusText).message;
      throw new Error(message);
    }

    const result = await response.json();
    if (!result?.success && result?.message) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Network request failed. Please check your connection and try again.");
  }
}

export const notificationService = {
  async getNotifications(page = 1, limit = 20, unreadOnly = false) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (unreadOnly) params.set("unread", "true");

    try {
      const response = await fetch(`${API_BASE}/admin/notifications?${params}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = result.message || new Error(response.statusText).message;
        throw new Error(message);
      }

      return result;
    } catch (error) {
      throw new Error(error.message || "Failed to fetch notifications");
    }
  },

  async getUnreadCount() {
    try {
      const response = await fetch(`${API_BASE}/admin/notifications/unread-count`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = result.message || new Error(response.statusText).message;
        throw new Error(message);
      }

      return result;
    } catch (error) {
      throw new Error(error.message || "Failed to fetch unread count");
    }
  },

  async markAsRead(notificationId) {
    try {
      const response = await fetch(`${API_BASE}/admin/notifications/${encodeURIComponent(notificationId)}/read`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = result.message || new Error(response.statusText).message;
        throw new Error(message);
      }

      return result;
    } catch (error) {
      throw new Error(error.message || "Failed to mark notification as read");
    }
  },

  async markAllAsRead() {
    try {
      const response = await fetch(`${API_BASE}/admin/notifications/read-all`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = result.message || new Error(response.statusText).message;
        throw new Error(message);
      }

      return result;
    } catch (error) {
      throw new Error(error.message || "Failed to mark all notifications as read");
    }
  },
};