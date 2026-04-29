import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, ClipboardList, Clock, CheckCircle, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function DashboardCliente() {
  const { user } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/tareas/mis-tareas")
      .then((r) => setTareas(r.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: "Tareas publicadas",
      value: tareas.length,
      icon: ClipboardList,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "En progreso",
      value: tareas.filter((t) => t.estado === "en_progreso").length,
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Completadas",
      value: tareas.filter((t) => t.estado === "completada").length,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Pendientes",
      value: tareas.filter((t) => t.estado === "pendiente").length,
      icon: Users,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  const estadoColor = {
    pendiente: "bg-gray-100 text-gray-600",
    en_progreso: "bg-amber-100 text-amber-700",
    completada: "bg-green-100 text-green-700",
    cancelada: "bg-red-100 text-red-600",
  };

  const estadoLabel = {
    pendiente: "Pendiente",
    en_progreso: "En progreso",
    completada: "Completada",
    cancelada: "Cancelada",
  };

  return (
    <div className="flex-1 bg-gray-50 px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hola, {user?.nombre} 👋
            </h1>
            <p className="text-gray-500 mt-1">
              Gestiona tus solicitudes de servicio
            </p>
          </div>
          <Link
            to="/dashboard/cliente/tareas/nueva"
            style={{ backgroundColor: "#10b981" }}
            className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            Nueva tarea
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-gray-200 p-5"
              >
                <div className={`inline-flex p-2 rounded-xl ${s.color} mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Mis tareas */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Mis tareas</h2>
            <Link
              to="/dashboard/cliente/tareas/nueva"
              className="text-sm font-medium hover:underline"
              style={{ color: "#10b981" }}
            >
              + Nueva
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#10b981", borderTopColor: "transparent" }} />
            </div>
          ) : tareas.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No tienes tareas aún</p>
              <p className="text-gray-400 text-sm mt-1">
                Crea tu primera solicitud de servicio
              </p>
              <Link
                to="/dashboard/cliente/tareas/nueva"
                style={{ backgroundColor: "#10b981" }}
                className="inline-block mt-4 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition"
              >
                Crear tarea
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tareas.map((t) => (
                <div
                  key={t.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{t.titulo}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {t.categoria || "Sin categoría"} ·{" "}
                      {new Date(t.created_at).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full ${estadoColor[t.estado] || "bg-gray-100 text-gray-600"}`}
                    >
                      {estadoLabel[t.estado] || t.estado}
                    </span>
                    <Link
                      to={`/dashboard/cliente/tareas/${t.id}`}
                      className="text-xs font-medium text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition"
                      style={{ backgroundColor: "#10b981" }}
                    >
                      Ver postulaciones
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
