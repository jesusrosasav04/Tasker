import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User, Bell, LifeBuoy } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const navLinks = [
  { to: "/", label: "Inicio" },
  { to: "/proveedores", label: "Especialistas" },
  { to: "/#pasos", label: "Cómo funciona" },
];

function NotificacionesPanel({ onClose }) {
  const [notis, setNotis]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/notificaciones")
      .then((r) => setNotis(r.data.data || []))
      .finally(() => setLoading(false));

    api.patch("/notificaciones/leer-todas").catch(() => {});
  }, []);

  return (
    <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-3xl border border-arena bg-white shadow-xl shadow-stone-900/10">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="font-display text-base font-bold text-tinta">Notificaciones</span>
        <button onClick={onClose} aria-label="Cerrar" className="rounded-full p-2 text-stone-500 hover:bg-crema">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "#0f766e", borderTopColor: "transparent" }} />
          </div>
        ) : notis.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">Sin notificaciones</p>
        ) : (
          notis.map((n) => (
            <div key={n.id}
              className={`px-4 py-3 border-b border-gray-50 last:border-0 ${n.leido === 0 ? "bg-menta/40" : ""}`}>
              <p className="text-sm text-gray-900 leading-relaxed">{n.mensaje}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(n.created_at).toLocaleDateString("es-MX", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Navbar() {
  const { pathname }    = useLocation();
  const navigate        = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen]       = useState(false);
  const [showNotis, setShowNotis] = useState(false);
  const [noLeidas, setNoLeidas]   = useState(0);
  const notisRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const fetchCount = () => {
      api.get("/notificaciones/no-leidas")
        .then((r) => setNoLeidas(r.data.data?.total || 0))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Cerrar panel al click fuera
  useEffect(() => {
    const handler = (e) => {
      if (notisRef.current && !notisRef.current.contains(e.target)) {
        setShowNotis(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => { logout(); navigate("/"); };

  const dashboardLink =
    user?.role === "trabajador" ? "/dashboard/trabajador"
    : user?.role === "admin"    ? "/admin"
    : "/dashboard/cliente";

  return (
    <header className="sticky top-0 z-50 border-b border-arena/70 bg-crema/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-6">
        <Link to="/" className="font-display text-[26px] font-extrabold tracking-tight text-tinta">
          tasker<span className="text-primary">.</span>
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-arena bg-white p-1.5 md:flex">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}
              className={`rounded-full px-4 py-2 text-[15px] font-medium transition-colors ${
                pathname === link.to
                  ? "bg-tinta text-crema"
                  : "text-stone-700 hover:bg-crema hover:text-tinta"
              }`}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth + notificaciones */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <div className="flex items-center gap-2">
              {/* Campana */}
              <div className="relative" ref={notisRef}>
                <button onClick={() => { setShowNotis(!showNotis); setNoLeidas(0); }}
                  aria-label="Notificaciones"
                  className="relative flex h-11 w-11 items-center justify-center rounded-full text-stone-600 transition hover:bg-white">
                  <Bell className="h-5 w-5" />
                  {noLeidas > 0 && (
                    <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                      {noLeidas > 9 ? "9+" : noLeidas}
                    </span>
                  )}
                </button>
                {showNotis && (
                  <NotificacionesPanel onClose={() => setShowNotis(false)} />
                )}
              </div>

              {user.role !== "admin" && (
                <Link to="/soporte" aria-label="Soporte" title="Soporte"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-stone-600 transition hover:bg-white">
                  <LifeBuoy className="h-5 w-5" />
                </Link>
              )}
              <Link to={dashboardLink}
                className="flex items-center gap-2 rounded-full border border-arena bg-white py-1.5 pl-1.5 pr-4 text-[15px] font-medium text-tinta transition hover:border-stone-400">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-miel font-display text-sm font-bold text-miel-dark">
                  {user.nombre?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                </span>
                {user.role === "admin" ? "Panel admin" : user.nombre?.split(" ")[0]}
              </Link>
              <button onClick={handleLogout} aria-label="Cerrar sesión"
                className="flex h-11 w-11 items-center justify-center rounded-full text-stone-600 transition hover:bg-white hover:text-red-600">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login"
                className="px-4 py-3 text-[15px] font-semibold text-tinta hover:text-primary">
                Entrar
              </Link>
              <Link to="/register"
                className="rounded-full bg-primary px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-primary-dark">
                Crear cuenta
              </Link>
            </>
          )}
        </div>

        <button className="flex h-11 w-11 items-center justify-center rounded-full text-stone-600 hover:bg-white md:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-arena bg-crema px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setOpen(false)}
                className={`rounded-2xl px-4 py-3 text-[15px] font-medium ${
                  pathname === link.to ? "bg-tinta text-crema" : "text-stone-700 hover:bg-white"
                }`}>
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to={dashboardLink} onClick={() => setOpen(false)}
                  className="rounded-2xl px-4 py-3 text-[15px] font-medium text-tinta hover:bg-white">
                  {user.role === "admin" ? "Panel admin" : "Mi panel"}
                </Link>
                {user.role !== "admin" && (
                  <Link to="/soporte" onClick={() => setOpen(false)}
                    className="rounded-2xl px-4 py-3 text-[15px] font-medium text-tinta hover:bg-white">
                    Soporte
                  </Link>
                )}
                <button onClick={() => { handleLogout(); setOpen(false); }}
                  className="rounded-2xl px-4 py-3 text-left text-[15px] font-medium text-red-600 hover:bg-red-50">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}
                  className="rounded-2xl px-4 py-3 text-[15px] font-medium text-tinta hover:bg-white">
                  Entrar
                </Link>
                <Link to="/register" onClick={() => setOpen(false)}
                  className="rounded-2xl bg-primary px-4 py-3 text-[15px] font-semibold text-white">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
