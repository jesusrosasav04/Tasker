import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true, // Necesario para enviar/recibir cookies CSRF
});

// ── Helper: leer cookie por nombre ───────────────────
const getCookie = (name) => {
  const match = document.cookie
    .split("; ")
    .find((r) => r.startsWith(`${name}=`));
  return match ? match.split("=")[1] : null;
};

// ── Obtener token CSRF al iniciar ────────────────────
let csrfInitialized = false;

const initCsrf = async () => {
  if (csrfInitialized) return;
  try {
    await api.get("/csrf-token");
    csrfInitialized = true;
  } catch {
    // Si falla, continúa sin CSRF (ej. en pruebas)
  }
};

initCsrf();

// ── Interceptor de request ───────────────────────────
api.interceptors.request.use((config) => {
  // JWT en header Authorization
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // CSRF token en header para métodos mutantes
  const safeMethods = ["get", "head", "options"];
  if (!safeMethods.includes(config.method?.toLowerCase())) {
    const csrfToken = getCookie("csrf_token");
    if (csrfToken) config.headers["x-csrf-token"] = csrfToken;
  }

  return config;
});

// ── Interceptor de response ──────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Token expirado → limpiar y redirigir a login
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    // Token CSRF inválido → refrescar y reintentar una vez
    if (error.response?.status === 403 &&
        error.response?.data?.error?.includes("CSRF")) {
      csrfInitialized = false;
      await initCsrf();
      // Reintentar la petición original
      const config = error.config;
      const newCsrf = getCookie("csrf_token");
      if (newCsrf) config.headers["x-csrf-token"] = newCsrf;
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;
