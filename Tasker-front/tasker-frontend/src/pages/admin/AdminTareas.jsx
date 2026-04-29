import { useState, useEffect, useCallback } from "react";
import { ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../api/axios";
import AdminLayout from "./AdminLayout";

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "en_progreso", label: "En progreso" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
];

const estadoStyle = {
  pendiente: "bg-gray-100 text-gray-600",
  en_progreso: "bg-amber-100 text-amber-700",
  completada: "bg-green-100 text-green-700",
  cancelada: "bg-red-100 text-red-500",
};

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

export default function AdminTareas() {
  const [tareas, setTareas] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const LIMIT = 20;

  const cargar = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (estadoFiltro) params.set("estado", estadoFiltro);

    api
      .get(`/admin/tareas?${params}`)
      .then((r) => {
        setTareas(r.data.data?.tareas || []);
        setTotal(r.data.data?.total || 0);
      })
      .catch(() => setErrMsg("Error al cargar tareas."))
      .finally(() => setLoading(false));
  }, [page, estadoFiltro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Resetear a página 1 al cambiar filtro
  const handleFiltro = (val) => {
    setEstadoFiltro(val);
    setPage(1);
  };

  const totalPaginas = Math.ceil(total / LIMIT);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {total} tarea{total !== 1 ? "s" : ""} en total
            </p>
          </div>

          {/* Filtro por estado */}
          <div className="flex flex-wrap gap-2">
            {ESTADOS.map((e) => (
              <button
                key={e.value}
                onClick={() => handleFiltro(e.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                  estadoFiltro === e.value
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {errMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {errMsg}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Cabecera tabla */}
          <div className="hidden md:grid grid-cols-[1fr_140px_120px_100px_100px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>Tarea</span>
            <span>Categoría</span>
            <span>Cliente</span>
            <span>Fecha</span>
            <span className="text-right">Estado</span>
          </div>

          {loading ? (
            <Spinner />
          ) : tareas.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay tareas con este filtro</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tareas.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_140px_120px_100px_100px] gap-2 md:gap-4 px-6 py-4 items-center hover:bg-gray-50 transition"
                >
                  {/* Título y descripción */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {t.titulo}
                    </p>
                    {t.descripcion && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {t.descripcion}
                      </p>
                    )}
                    {t.presupuesto && (
                      <p className="text-xs text-emerald-600 font-medium mt-0.5">
                        ${Number(t.presupuesto).toLocaleString("es-MX")}
                      </p>
                    )}
                  </div>

                  {/* Categoría */}
                  <p className="hidden md:block text-sm text-gray-500 truncate">
                    {t.categoria}
                  </p>

                  {/* Cliente */}
                  <p className="hidden md:block text-sm text-gray-500 truncate">
                    {t.cliente_nombre}
                  </p>

                  {/* Fecha */}
                  <p className="hidden md:block text-xs text-gray-400">
                    {new Date(t.created_at).toLocaleDateString("es-MX")}
                  </p>

                  {/* Estado */}
                  <div className="flex md:justify-end">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoStyle[t.estado] || "bg-gray-100 text-gray-600"}`}
                    >
                      {t.estado?.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Página {page} de {totalPaginas}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
                  disabled={page === totalPaginas || loading}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
