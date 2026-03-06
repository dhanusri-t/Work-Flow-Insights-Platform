import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

// Attach JWT automatically
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

// Auth API
export const authAPI = {
  login: (email, password) => api.post("/login", { email, password }),
  me: () => api.get("/me"),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
  getActivity: (limit = 20) => api.get(`/dashboard/activity?limit=${limit}`),
  getTeam: () => api.get("/dashboard/team"),
};

// Workflows API
export const workflowsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/workflows${query ? `?${query}` : ''}`);
  },
  getById: (id) => api.get(`/workflows/${id}`),
  create: (data) => api.post("/workflows", data),
  update: (id, data) => api.put(`/workflows/${id}`, data),
  delete: (id) => api.delete(`/workflows/${id}`),
};

// Tasks API
export const tasksAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/tasks${query ? `?${query}` : ''}`);
  },
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post("/tasks", data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  addReview: (id, data) => api.post(`/tasks/${id}/review`, data),
};

// Team API
export const teamAPI = {
  getAll: () => api.get("/dashboard/team"),
};

export default api;
