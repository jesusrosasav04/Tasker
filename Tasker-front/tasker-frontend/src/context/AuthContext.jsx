import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al cargar la app, verificar si hay token guardado
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api
        .get("/auth/me")
        .then((r) => setUser(r.data.data))
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", r.data.data.token);
    setUser(r.data.data.usuario);
    return r.data.data.usuario;
  };

  const register = async (datos) => {
    const r = await api.post("/auth/register", datos);
    localStorage.setItem("token", r.data.data.token);
    setUser(r.data.data.usuario);
    return r.data.data.usuario;
  };

  // Onboarding de Google: define rol (y categorías) y refresca la sesión
  const completarPerfil = async (payload) => {
    const r = await api.post("/auth/completar-perfil", payload);
    localStorage.setItem("token", r.data.data.token);
    const me = await api.get("/auth/me");
    setUser(me.data.data);
    return me.data.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    // Limpiar cookie HttpOnly del servidor
    api.post("/auth/logout").catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, completarPerfil }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
