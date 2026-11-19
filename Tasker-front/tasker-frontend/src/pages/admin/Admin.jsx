import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Briefcase, ClipboardList, AlertCircle, ChevronRight } from "lucide-react";
import api from "../../api/axios";
import SkeletonLista from "../../components/Skeleton";
import AdminLayout from "./AdminLayout";

function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-arena p-5">
      <div className={`inline-flex p-2 rounded-xl ${color} mb-3`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-3xl font-bold text-tinta">{value ?? "—"}</p>
      <p className="text-sm text-piedra mt-0.5">{label}</p>
      {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
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
          <h1 className="font-display text-2xl font-bold text-tinta">Panel de administración</h1>
          <p className="text-piedra mt-1 text-sm">Resumen general del sistema</p>
        </div>

        {loading ? (
          <SkeletonLista />
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
            <h2 className="font-display text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
              Usuarios
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <StatCard
                label="Total usuarios activos"
                value={stats?.usuarios?.total}
                icon={Users}
                color="bg-stone-100 text-tinta"
              />
              <StatCard
                label="Clientes"
                value={stats?.usuarios?.clientes}
                icon={Users}
                color="bg-stone-100 text-tinta"
              />
              <StatCard
                label="Trabajadores verificados"
                value={stats?.usuarios?.trabajadores}
                icon={Briefcase}
                color="bg-menta text-primary"
              />
            </div>

            {/* Tareas */}
            <h2 className="font-display text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
              Tareas
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <StatCard
                label="Total tareas"
                value={stats?.tareas?.total}
                icon={ClipboardList}
                color="bg-stone-100 text-piedra"
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
                color="bg-menta text-primary"
              />
            </div>

            {/* Accesos rápidos */}
            <h2 className="font-display text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
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
                  className="flex items-center justify-between gap-3 bg-white border border-arena rounded-xl px-4 py-3.5 hover:bg-crema transition"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-piedra" />
                    <span className="text-sm font-medium text-stone-700">{label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-stone-400" />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
