import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Briefcase, ClipboardList, AlertCircle, ChevronRight } from "lucide-react";
import api from "../../api/axios";
import AdminLayout from "./AdminLayout";

function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className={`inline-flex p-2 rounded-xl ${color} mb-3`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-3xl font-bold text-gray-900">{value ?? "—"}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div
        className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: "#10b981", borderTopColor: "transparent" }}
      />
    </div>
  );
}

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    api
      .get("/admin/estadisticas")
      .then((r) => setStats(r.data.data))
      .catch(() => setErrMsg("No se pudieron cargar las estadísticas."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>
          <p className="text-gray-500 mt-1 text-sm">Resumen general del sistema</p>
        </div>

        {loading ? (
          <Spinner />
        ) : errMsg ? (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
            {errMsg}
          </div>
        ) : (
          <>
            {/* Alerta trabajadores pendientes */}
            {stats?.trabajadores_por_verificar > 0 && (
              <Link
                to="/admin/trabajadores"
                className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 hover:bg-amber-100 transition"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-amber-800">
                    {stats.trabajadores_por_verificar} trabajador
                    {stats.trabajadores_por_verificar !== 1 ? "es" : ""} pendiente
                    {stats.trabajadores_por_verificar !== 1 ? "s" : ""} de verificación
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-amber-500 flex-shrink-0" />
              </Link>
            )}

            {/* Usuarios */}
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Usuarios
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <StatCard
                label="Total usuarios activos"
                value={stats?.usuarios?.total}
                icon={Users}
                color="bg-blue-50 text-blue-600"
              />
              <StatCard
                label="Clientes"
                value={stats?.usuarios?.clientes}
                icon={Users}
                color="bg-indigo-50 text-indigo-600"
              />
              <StatCard
                label="Trabajadores verificados"
                value={stats?.usuarios?.trabajadores}
                icon={Briefcase}
                color="bg-emerald-50 text-emerald-600"
              />
            </div>

            {/* Tareas */}
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Tareas
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <StatCard
                label="Total tareas"
                value={stats?.tareas?.total}
                icon={ClipboardList}
                color="bg-gray-100 text-gray-600"
              />
              <StatCard
                label="Pendientes"
                value={stats?.tareas?.pendientes}
                icon={ClipboardList}
                color="bg-amber-50 text-amber-600"
              />
              <StatCard
                label="Completadas"
                value={stats?.tareas?.completadas}
                icon={ClipboardList}
                color="bg-green-50 text-green-600"
              />
            </div>

            {/* Accesos rápidos */}
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Accesos rápidos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { to: "/admin/usuarios", label: "Gestionar usuarios", icon: Users },
                { to: "/admin/trabajadores", label: "Verificar trabajadores", icon: Briefcase },
                { to: "/admin/tareas", label: "Ver todas las tareas", icon: ClipboardList },
              ].map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3.5 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
