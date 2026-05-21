// Auth token helpers — thin wrappers so storage strategy is centralised
const TOKEN_KEY = "sc_token";
const USER_KEY  = "sc_user";

export const getToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

export const setToken = (token: string): void =>
  localStorage.setItem(TOKEN_KEY, token);

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
