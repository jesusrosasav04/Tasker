import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Wrench, Menu, X, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { to: "/", label: "Inicio" },
  { to: "/proveedores", label: "Proveedores" },
  { to: "/publicar", label: "Solicitar" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const dashboardLink =
    user?.role === "trabajador"
      ? "/dashboard/trabajador"
      : user?.role === "admin"
        ? "/admin"
        : "/dashboard/cliente";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Wrench className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Tasker</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                pathname === link.to
                  ? "bg-primary text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to={dashboardLink}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary transition"
              >
                <User className="h-4 w-4" />
                {user.nombre}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-primary transition"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                style={{ backgroundColor: "#10b981" }}
                className="text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  pathname === link.to
                    ? "bg-primary text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to={dashboardLink}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Mi Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }}
                  className="text-left rounded-lg px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-white bg-primary"
                >
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
