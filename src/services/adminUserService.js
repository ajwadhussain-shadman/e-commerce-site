const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "The user-management request failed");
  return result;
}

export const adminUserService = {
  async list({ page = 1, search = "" } = {}) {
    const query = new URLSearchParams({ page: String(page), limit: "25", search });
    return request(`/admin/users?${query}`);
  },
  async setRole(userId, role) {
    return request(`/admin/users/${encodeURIComponent(userId)}/role`, {
      method: "PATCH", body: JSON.stringify({ role }),
    });
  },
};
