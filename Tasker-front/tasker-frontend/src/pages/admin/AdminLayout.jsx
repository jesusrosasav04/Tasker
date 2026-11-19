import { NavLink, useNavigate } from "react-router-dom";
import { BarChart2, Users, Briefcase, ClipboardList, Tag, LogOut, Wrench, Flag } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { to: "/admin", label: "Estadísticas", icon: BarChart2, end: true },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users },
  { to: "/admin/trabajadores", label: "Trabajadores", icon: Briefcase },
  { to: "/admin/tareas", label: "Tareas", icon: ClipboardList },
  { to: "/admin/reportes", label: "Reportes", icon: Flag },
  { to: "/admin/categorias", label: "Categorías", icon: Tag },
];

export default function AdminLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-1">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-arena py-6 px-3 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Wrench className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-tinta">Admin</span>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-menta text-primary"
                    : "text-piedra hover:bg-stone-100 hover:text-tinta"
                }`
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-piedra hover:bg-red-50 hover:text-red-600 transition-colors mt-2"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </aside>

      {/* Navegación móvil (top bar) */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="lg:hidden flex overflow-x-auto border-b border-arena bg-white px-2">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-piedra hover:text-stone-700"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Contenido */}
        <main className="flex-1 bg-crema px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
