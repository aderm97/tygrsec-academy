import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sc_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("sc_refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;
        localStorage.setItem("sc_token", access_token);
        localStorage.setItem("sc_refresh_token", refresh_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("sc_token");
        localStorage.removeItem("sc_refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data: { username_or_email: string; password: string }) =>
    api.post("/auth/login", data),
  register: (data: { username: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  refresh: (refreshToken: string) =>
    api.post("/auth/refresh", { refresh_token: refreshToken }),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
};

// Challenges API
export const challengesApi = {
  list: (params?: {
    category?: string;
    difficulty?: string;
    search?: string;
    page?: number;
    size?: number;
  }) => api.get("/challenges", { params }),
  get: (id: string) => api.get(`/challenges/${id}`),
  submitFlag: (id: string, flag: string) =>
    api.post(`/challenges/${id}/submit`, { flag }),
  getHints: (id: string) => api.get(`/challenges/${id}/hints`),
  start: (id: string) => api.post(`/challenges/${id}/start`),
};

// User API
export const userApi = {
  me: () => api.get("/users/me"),
  stats: () => api.get("/users/me/stats"),
  progress: () => api.get("/users/me/progress"),
  badges: () => api.get("/users/me/badges"),
  updateProfile: (data: Partial<User>) => api.put("/users/me", data),
};

// Labs API
export const labsApi = {
  create: (challengeId: string) => api.post("/labs", { challenge_id: challengeId }),
  get: (id: string) => api.get(`/labs/${id}`),
  destroy: (id: string) => api.delete(`/labs/${id}`),
  getTerminal: (id: string) => api.post(`/labs/${id}/terminal`),
};

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string;
  level: number;
  xp: number;
  rank: number;
  challenges_solved: number;
  first_bloods: number;
  current_streak: number;
  best_streak: number;
  is_admin: boolean;
  is_premium: boolean;
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  difficulty: "beginner" | "easy" | "medium" | "hard" | "expert";
  category: Category;
  points: number;
  solves_count: number;
  has_walkthrough: boolean;
  tags: Tag[];
  is_solved?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Badge {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  earned_at?: string;
}

export interface Lab {
  id: string;
  challenge_id: string;
  status: string;
  url?: string;
  expires_at: string;
  time_remaining_seconds: number;
}