import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
});

// ── Token CSRF en memoria (respaldo cross-domain) ─────
let csrfToken = null;
let csrfInitialized = false;

const getCookieValue = (name) => {
  const match = document.cookie.split("; ").find((r) => r.startsWith(`${name}=`));
  return match ? match.split("=")[1] : null;
};

const initCsrf = async () => {
  if (csrfInitialized) return;
  try {
    const res = await api.get("/csrf-token");
    // Guardar en memoria como respaldo si la cookie no llega (cross-domain)
    if (res.data?.data?.csrf_token) {
      csrfToken = res.data.data.csrf_token;
    }
    csrfInitialized = true;
  } catch {
    // Continúa sin CSRF si falla
  }
};

initCsrf();

// ── Interceptor de request ───────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const safeMethods = ["get", "head", "options"];
  if (!safeMethods.includes(config.method?.toLowerCase())) {
    // Intentar cookie primero, luego memoria
    const tokenCsrf = getCookieValue("csrf_token") || csrfToken;
    if (tokenCsrf) config.headers["x-csrf-token"] = tokenCsrf;
  }

  return config;
});

// ── Interceptor de response ──────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    if (
      error.response?.status === 403 &&
      error.response?.data?.error?.includes("CSRF")
    ) {
      csrfInitialized = false;
      csrfToken = null;
      await initCsrf();
      const config = error.config;
      const newCsrf = getCookieValue("csrf_token") || csrfToken;
      if (newCsrf) config.headers["x-csrf-token"] = newCsrf;
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;
