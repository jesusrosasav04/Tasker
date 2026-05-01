import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Wrench, Menu, X, LogOut, User, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const navLinks = [
  { to: "/", label: "Inicio" },
  { to: "/proveedores", label: "Proveedores" },
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
    <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="font-semibold text-gray-900 text-sm">Notificaciones</span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "#10b981", borderTopColor: "transparent" }} />
          </div>
        ) : notis.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">Sin notificaciones</p>
        ) : (
          notis.map((n) => (
            <div key={n.id}
              className={`px-4 py-3 border-b border-gray-50 last:border-0 ${n.leido === 0 ? "bg-emerald-50/40" : ""}`}>
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
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: "#10b981" }}>
            <Wrench className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Tasker</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                pathname === link.to
                  ? "text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
              style={pathname === link.to ? { backgroundColor: "#10b981" } : {}}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth + notificaciones */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Campana */}
              <div className="relative" ref={notisRef}>
                <button onClick={() => { setShowNotis(!showNotis); setNoLeidas(0); }}
                  className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition">
                  <Bell className="h-5 w-5" />
                  {noLeidas > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white text-xs font-bold"
                      style={{ backgroundColor: "#10b981", fontSize: "10px" }}>
                      {noLeidas > 9 ? "9+" : noLeidas}
                    </span>
                  )}
                </button>
                {showNotis && (
                  <NotificacionesPanel onClose={() => setShowNotis(false)} />
                )}
              </div>

              <Link to={dashboardLink}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-emerald-600 transition">
                <User className="h-4 w-4" />
                {user.nombre}
              </Link>
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition">
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>
          ) : (
            <>
              <Link to="/login"
                className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition">
                Iniciar sesión
              </Link>
              <Link to="/register"
                style={{ backgroundColor: "#10b981" }}
                className="text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
                Registrarse
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setOpen(false)}
                className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  pathname === link.to ? "text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
                style={pathname === link.to ? { backgroundColor: "#10b981" } : {}}>
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to={dashboardLink} onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100">
                  Mi Dashboard
                </Link>
                <button onClick={() => { handleLogout(); setOpen(false); }}
                  className="text-left rounded-lg px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100">
                  Iniciar sesión
                </Link>
                <Link to="/register" onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-white"
                  style={{ backgroundColor: "#10b981" }}>
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
