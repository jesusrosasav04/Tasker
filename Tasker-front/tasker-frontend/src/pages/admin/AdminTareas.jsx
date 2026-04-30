import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList, ChevronLeft, ChevronRight, Trash2,
  X, AlertTriangle, User, Tag, DollarSign,
  MapPin, Calendar, CheckCircle, Users,
} from "lucide-react";
import api from "../../api/axios";
import AdminLayout from "./AdminLayout";

// ── Constantes ────────────────────────────────────────
const ESTADOS = [
  { value: "",            label: "Todos" },
  { value: "pendiente",   label: "Pendiente" },
  { value: "en_progreso", label: "En progreso" },
  { value: "completada",  label: "Completada" },
  { value: "cancelada",   label: "Cancelada" },
];

const estadoStyle = {
  pendiente:   { cls: "bg-gray-100 text-gray-600",   label: "Pendiente" },
  en_progreso: { cls: "bg-amber-100 text-amber-700", label: "En progreso" },
  completada:  { cls: "bg-green-100 text-green-700", label: "Completada" },
  cancelada:   { cls: "bg-red-100 text-red-500",     label: "Cancelada" },
};

const postulacionEstilo = {
  pendiente: "bg-gray-100 text-gray-600",
  aceptada:  "bg-green-100 text-green-700",
  rechazada: "bg-red-100 text-red-500",
};

// ── Spinner ───────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: "#10b981", borderTopColor: "transparent" }} />
    </div>
  );
}

// ── Modal confirmar eliminar ──────────────────────────
function ModalEliminar({ tarea, onClose, onEliminada }) {
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg]   = useState("");

  const handleEliminar = async () => {
    setLoading(true);
    setErrMsg("");
    try {
      await api.delete(`/admin/tareas/${tarea.id}`);
      onEliminada();
    } catch (err) {
      setErrMsg(err.response?.data?.error || "Error al eliminar la tarea.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mb-4">
          <Trash2 className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">Eliminar tarea</h3>
        <p className="text-sm text-gray-500 mb-4">
          ¿Estás seguro de eliminar{" "}
          <span className="font-medium text-gray-900">"{tarea.titulo}"</span>?
          Se eliminarán también todas sus postulaciones.
        </p>

        {errMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {errMsg}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={handleEliminar} disabled={loading}
            className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition disabled:opacity-50">
            {loading ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Panel de detalle lateral ──────────────────────────
function PanelDetalle({ tareaId, onClose, onEliminar, onEstadoCambiado }) {
  const [detalle, setDetalle]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [cambiando, setCambiando]   = useState(false);
  const [errMsg, setErrMsg]         = useState("");

  useEffect(() => {
    setLoading(true);
    setDetalle(null);
    api.get(`/admin/tareas/${tareaId}`)
      .then((r) => setDetalle(r.data.data))
      .catch(() => setErrMsg("Error al cargar el detalle."))
      .finally(() => setLoading(false));
  }, [tareaId]);

  const handleEstado = async (nuevoEstado) => {
    setCambiando(true);
    setErrMsg("");
    try {
      await api.patch(`/admin/tareas/${tareaId}/estado`, { estado: nuevoEstado });
      setDetalle((prev) => ({ ...prev, estado: nuevoEstado }));
      onEstadoCambiado(tareaId, nuevoEstado);
    } catch (err) {
      setErrMsg(err.response?.data?.error || "Error al cambiar estado.");
    } finally {
      setCambiando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">Detalle de tarea</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => onEliminar(detalle)} disabled={!detalle}
              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition disabled:opacity-30">
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <Spinner />
          ) : errMsg ? (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {errMsg}
            </div>
          ) : detalle && (
            <>
              {/* Info principal */}
              <div>
                <h3 className="font-bold text-gray-900 text-lg leading-snug">
                  {detalle.titulo}
                </h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {detalle.descripcion}
                </p>
              </div>

              {/* Metadatos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Tag className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {detalle.categoria}
                </div>
                {detalle.presupuesto && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    ${Number(detalle.presupuesto).toLocaleString("es-MX")}
                  </div>
                )}
                {detalle.ubicacion && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    {detalle.ubicacion}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {detalle.cliente_nombre}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {new Date(detalle.created_at).toLocaleDateString("es-MX")}
                </div>
              </div>

              {/* Estado actual + selector */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Estado
                </p>
                <div className="flex flex-wrap gap-2">
                  {["pendiente", "en_progreso", "completada", "cancelada"].map((est) => {
                    const s = estadoStyle[est];
                    const activo = detalle.estado === est;
                    return (
                      <button
                        key={est}
                        onClick={() => !activo && handleEstado(est)}
                        disabled={cambiando || activo}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border-2 transition ${
                          activo
                            ? `${s.cls} border-current`
                            : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                        } disabled:cursor-default`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
                {cambiando && (
                  <p className="text-xs text-gray-400 mt-2">Actualizando estado...</p>
                )}
                {errMsg && (
                  <p className="text-xs text-red-500 mt-2">{errMsg}</p>
                )}
              </div>

              {/* Postulaciones */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  Postulaciones ({detalle.postulaciones?.length || 0})
                </p>

                {!detalle.postulaciones?.length ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    Aún no hay postulaciones
                  </p>
                ) : (
                  <div className="space-y-2">
                    {detalle.postulaciones.map((p) => (
                      <div key={p.id}
                        className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {p.trabajador_nombre}
                            </p>
                            <p className="text-xs text-gray-400">{p.trabajador_email}</p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${postulacionEstilo[p.estado] || "bg-gray-100 text-gray-600"}`}>
                            {p.estado === "aceptada" ? "Aceptada ✓" : p.estado === "rechazada" ? "Rechazada" : "Pendiente"}
                          </span>
                        </div>
                        {p.precio_propuesto && (
                          <p className="text-xs text-emerald-600 font-medium mt-1.5">
                            Oferta: ${Number(p.precio_propuesto).toLocaleString("es-MX")}
                          </p>
                        )}
                        {p.mensaje && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            "{p.mensaje}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────
export default function AdminTareas() {
  const [tareas, setTareas]             = useState([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [loading, setLoading]           = useState(true);
  const [errMsg, setErrMsg]             = useState("");
  const [panelId, setPanelId]           = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const LIMIT = 20;

  const cargar = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (estadoFiltro) params.set("estado", estadoFiltro);

    api.get(`/admin/tareas?${params}`)
      .then((r) => {
        setTareas(r.data.data?.tareas || []);
        setTotal(r.data.data?.total || 0);
      })
      .catch(() => setErrMsg("Error al cargar tareas."))
      .finally(() => setLoading(false));
  }, [page, estadoFiltro]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleFiltro = (val) => { setEstadoFiltro(val); setPage(1); };

  const handleEliminada = () => {
    setModalEliminar(null);
    setPanelId(null);
    cargar();
  };

  const handleEstadoCambiado = (id, nuevoEstado) => {
    setTareas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, estado: nuevoEstado } : t))
    );
  };

  const totalPaginas = Math.ceil(total / LIMIT);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {total} tarea{total !== 1 ? "s" : ""} en total
            </p>
          </div>
          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            {ESTADOS.map((e) => (
              <button key={e.value} onClick={() => handleFiltro(e.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                  estadoFiltro === e.value
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                }`}>
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
          <div className="hidden md:grid grid-cols-[1fr_130px_110px_90px_80px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
              {tareas.map((t) => {
                const est = estadoStyle[t.estado] || { cls: "bg-gray-100 text-gray-600", label: t.estado };
                const seleccionada = panelId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setPanelId(seleccionada ? null : t.id)}
                    className={`grid grid-cols-1 md:grid-cols-[1fr_130px_110px_90px_80px] gap-2 md:gap-4 px-6 py-4 items-center cursor-pointer transition ${
                      seleccionada ? "bg-emerald-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{t.titulo}</p>
                      {t.descripcion && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{t.descripcion}</p>
                      )}
                      {t.presupuesto && (
                        <p className="text-xs text-emerald-600 font-medium mt-0.5">
                          ${Number(t.presupuesto).toLocaleString("es-MX")}
                        </p>
                      )}
                    </div>
                    <p className="hidden md:block text-sm text-gray-500 truncate">{t.categoria}</p>
                    <p className="hidden md:block text-sm text-gray-500 truncate">{t.cliente_nombre}</p>
                    <p className="hidden md:block text-xs text-gray-400">
                      {new Date(t.created_at).toLocaleDateString("es-MX")}
                    </p>
                    <div className="flex md:justify-end">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${est.cls}`}>
                        {est.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Página {page} de {totalPaginas}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
                  disabled={page === totalPaginas || loading}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-3 text-center">
          💡 Haz clic en cualquier tarea para ver su detalle, postulaciones y cambiar su estado.
        </p>
      </div>

      {/* Panel lateral de detalle */}
      {panelId && (
        <PanelDetalle
          tareaId={panelId}
          onClose={() => setPanelId(null)}
          onEliminar={(t) => setModalEliminar(t)}
          onEstadoCambiado={handleEstadoCambiado}
        />
      )}

      {/* Modal eliminar */}
      {modalEliminar && (
        <ModalEliminar
          tarea={modalEliminar}
          onClose={() => setModalEliminar(null)}
          onEliminada={handleEliminada}
        />
      )}
    </AdminLayout>
  );
}
