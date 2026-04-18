import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Star, DollarSign, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function DashboardTrabajador() {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/tareas/disponibles")
      .then((r) => setSolicitudes(r.data.data || []))
      .catch(() => setSolicitudes([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: "Solicitudes disponibles",
      value: solicitudes.length,
      icon: Briefcase,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Trabajos completados",
      value: 0,
      icon: Star,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Ingresos del mes",
      value: "$0",
      icon: DollarSign,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "En progreso",
      value: 0,
      icon: Clock,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="flex-1 bg-gray-50 px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Hola, {user?.nombre} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Aquí están las solicitudes disponibles
          </p>
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

        {/* Solicitudes disponibles */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Solicitudes disponibles
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                No hay solicitudes disponibles
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Vuelve más tarde para ver nuevas oportunidades
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {solicitudes.map((t) => (
                <div
                  key={t.TareaID}
                  className="px-6 py-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{t.Titulo}</p>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                        {t.Descripcion}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>📁 {t.categoria_nombre || "Sin categoría"}</span>
                        {t.direccion && <span>📍 {t.direccion}</span>}
                        <span>
                          📅{" "}
                          {new Date(t.FechaCreacion).toLocaleDateString(
                            "es-MX",
                          )}
                        </span>
                      </div>
                    </div>
                    {t.MontoAcordado && (
                      <span className="text-sm font-semibold text-green-600 ml-4 flex-shrink-0">
                        ${t.MontoAcordado}
                      </span>
                    )}
                  </div>
                  <button
                    style={{ backgroundColor: "#10b981" }}
                    className="mt-3 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition"
                  >
                    Postularme
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
