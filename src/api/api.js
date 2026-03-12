import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

// ── Request interceptor: attach JWT ───────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle errors globally ──────────────────────────────
// To show toasts from here, we use a small event bus since we can't use
// React hooks outside components. Pages can listen to this if needed,
// but the interceptor handles the most common cases automatically.
api.interceptors.response.use(
  (response) => response, // pass through successful responses unchanged
  (error) => {
    const status  = error.response?.status;
    const message = error.response?.data?.message
                 || error.response?.data?.error
                 || error.message
                 || "Something went wrong";

    // Auto-logout on 401 (expired/invalid token)
    if (status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    // Attach a clean message to the error so components can use it easily:
    // catch(e) { toast.error(e.userMessage) }
    error.userMessage = message;

    return Promise.reject(error);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post("/login", { email, password }),
  me: () => api.get("/me"),
};

// ── Dashboard API ─────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats:    ()              => api.get("/dashboard/stats"),
  getActivity: (limit = 20)   => api.get(`/dashboard/activity?limit=${limit}`),
  getTeam:     ()              => api.get("/dashboard/team"),
};

// ── Workflows API ─────────────────────────────────────────────────────────────
export const workflowsAPI = {
  getAll:  (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/workflows${query ? `?${query}` : ""}`);
  },
  getById: (id)          => api.get(`/workflows/${id}`),
  create:  (data)        => api.post("/workflows", data),
  update:  (id, data)    => api.put(`/workflows/${id}`, data),
  delete:  (id)          => api.delete(`/workflows/${id}`),
};

// ── Tasks API ─────────────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll:    (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/tasks${query ? `?${query}` : ""}`);
  },
  getById:   (id)          => api.get(`/tasks/${id}`),
  create:    (data)        => api.post("/tasks", data),
  update:    (id, data)    => api.put(`/tasks/${id}`, data),
  delete:    (id)          => api.delete(`/tasks/${id}`),
  addReview: (id, data)    => api.post(`/tasks/${id}/review`, data),
};

// ── Team API ──────────────────────────────────────────────────────────────────
export const teamAPI = {
  getAll: ()           => api.get("/dashboard/team"),
  updateRole: (id, role) => api.put(`/dashboard/team/${id}/role`, { role }),
  remove: (id)         => api.delete(`/dashboard/team/${id}`),
};

export default api;