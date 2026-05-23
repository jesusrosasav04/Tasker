import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, ClipboardList, Clock, CheckCircle, Users, Star, X, AlertTriangle, MessageSquare, Pencil, HelpCircle, Ban, Flag } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

// ── Modal ayuda (cancelar / reportar) ─────────────────
function ModalAyuda({ tarea, onClose, onCancelada }) {
  const [vista, setVista]       = useState("menu"); // menu | cancelar | reportar
  const [motivo, setMotivo]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [errMsg, setErrMsg]     = useState("");
  const [exito, setExito]       = useState("");

  const handleCancelar = async () => {
    setLoading(true); setErrMsg("");
    try {
      await api.patch(`/tareas/${tarea.id}/cancelar`, { motivo: motivo || undefined });
      setExito("Tarea cancelada correctamente.");
      setTimeout(() => { onCancelada(tarea.id); onClose(); }, 1500);
    } catch (err) {
      setErrMsg(err.response?.data?.error || "Error al cancelar la tarea");
    } finally { setLoading(false); }
  };

  const handleReportar = async () => {
    if (!motivo.trim()) { setErrMsg("Describe brevemente el problema"); return; }
    setLoading(true); setErrMsg("");
    try {
      await api.post(`/tareas/${tarea.id}/reportar`, { motivo });
      setExito("Reporte enviado. Un administrador lo revisará pronto.");
      setTimeout(onClose, 2000);
    } catch (err) {
      setErrMsg(err.response?.data?.error || "Error al enviar el reporte");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            {vista === "menu" ? "¿Necesitas ayuda?" : vista === "cancelar" ? "Cancelar tarea" : "Reportar problema"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {exito ? (
            <div className="text-center py-4">
              <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900">{exito}</p>
            </div>
          ) : vista === "menu" ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                Tarea: <span className="font-medium text-gray-900">"{tarea.titulo}"</span>
              </p>
              <button onClick={() => { setVista("reportar"); setMotivo(""); setErrMsg(""); }}
                className="w-full flex items-center gap-3 border border-amber-200 bg-amber-50 text-amber-700 px-4 py-3 rounded-xl text-sm font-medium hover:bg-amber-100 transition">
                <Flag className="h-5 w-5 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold">Reportar problema</p>
                  <p className="text-xs text-amber-600 font-normal mt-0.5">El trabajador no se presentó u otro problema</p>
                </div>
              </button>
              <button onClick={() => { setVista("cancelar"); setMotivo(""); setErrMsg(""); }}
                className="w-full flex items-center gap-3 border border-red-200 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium hover:bg-red-100 transition">
                <Ban className="h-5 w-5 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-semibold">Cancelar tarea</p>
                  <p className="text-xs text-red-500 font-normal mt-0.5">Cancelar definitivamente esta tarea</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {vista === "cancelar"
                  ? "¿Estás seguro de que quieres cancelar esta tarea? Esta acción no se puede deshacer."
                  : "Describe el problema que tienes con el trabajador:"}
              </p>
              <textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)}
                placeholder={vista === "cancelar"
                  ? "Motivo de cancelación (opcional)..."
                  : "Ej: El trabajador no se presentó a la hora acordada..."}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
              {errMsg && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />{errMsg}
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setVista("menu"); setErrMsg(""); }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                  Atrás
                </button>
                <button onClick={vista === "cancelar" ? handleCancelar : handleReportar}
                  disabled={loading}
                  className={`flex-1 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 ${
                    vista === "cancelar" ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"
                  }`}>
                  {loading ? "Enviando..." : vista === "cancelar" ? "Sí, cancelar" : "Enviar reporte"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal confirmar completar ─────────────────────────
function ModalCompletar({ tarea, onClose, onConfirmar }) {
  const [loading, setLoading] = useState(false);

  const handleConfirmar = async () => {
    setLoading(true);
    await onConfirmar(tarea.id);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 mx-auto mb-4">
          <CheckCircle className="h-7 w-7 text-emerald-500" />
        </div>
        <h3 className="font-bold text-gray-900 text-center text-lg mb-2">
          ¿Marcar como completada?
        </h3>
        <p className="text-sm text-gray-500 text-center mb-2">
          Vas a marcar la tarea <span className="font-medium text-gray-900">"{tarea.titulo}"</span> como completada.
        </p>
        <p className="text-xs text-amber-600 text-center bg-amber-50 rounded-lg px-3 py-2 mb-5">
          ⚠️ Esta acción no se puede deshacer. Asegúrate de que el trabajo fue realizado correctamente.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={handleConfirmar} disabled={loading}
            style={{ backgroundColor: "#10b981" }}
            className="flex-1 text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
            {loading ? "Procesando..." : "Sí, completar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal calificar ───────────────────────────────────
function ModalCalificar({ tarea, onClose, onCalificado }) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [hover, setHover]           = useState(0);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading]       = useState(false);
  const [errMsg, setErrMsg]         = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (puntuacion === 0) { setErrMsg("Selecciona una puntuación"); return; }
    setErrMsg("");
    setLoading(true);
    try {
      await api.post("/calificaciones", {
        tarea_id: tarea.id,
        puntuacion,
        ...(comentario.trim() && { comentario: comentario.trim() }),
      });
      onCalificado(tarea.id);
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setErrMsg("Ya calificaste esta tarea.");
      else if (status === 429) setErrMsg("Demasiadas solicitudes, intenta más tarde.");
      else setErrMsg(err.response?.data?.error || "Error al enviar la calificación.");
    } finally {
      setLoading(false);
    }
  };

  const labels = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Calificar trabajador</h3>
            <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{tarea.titulo}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Estrellas */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">¿Cómo fue tu experiencia?</p>
            <div className="flex items-center gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPuntuacion(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className="h-9 w-9 transition-colors"
                    fill={(hover || puntuacion) >= n ? "#f59e0b" : "none"}
                    stroke={(hover || puntuacion) >= n ? "#f59e0b" : "#d1d5db"}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
            {(hover || puntuacion) > 0 && (
              <p className="text-center text-sm font-medium text-amber-600 mt-2">
                {labels[hover || puntuacion]}
              </p>
            )}
          </div>

          {/* Comentario */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Comentario{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              rows={3}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              maxLength={500}
              placeholder="¿Cómo fue el trabajo? ¿Lo recomendarías?"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{comentario.length}/500</p>
          </div>

          {errMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {errMsg}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button type="submit" disabled={loading || puntuacion === 0}
              style={{ backgroundColor: "#10b981" }}
              className="flex-1 text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
              {loading ? "Enviando..." : "Enviar calificación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Dashboard cliente ─────────────────────────────────
export default function DashboardCliente() {
  const { user }  = useAuth();
  const [tareas, setTareas]                 = useState([]);
  const [loading, setLoading]               = useState(true);
  const [modalTarea, setModalTarea]         = useState(null);
  const [modalCompletar, setModalCompletar] = useState(null);
  const [modalAyuda, setModalAyuda]         = useState(null);
  const [calificadas, setCalificadas]       = useState(new Set());
  const [filtro, setFiltro]                 = useState("todas");

  useEffect(() => {
    api.get("/tareas/mis-tareas")
      .then((r) => setTareas(r.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "Tareas publicadas", value: tareas.length,                                          icon: ClipboardList, color: "bg-blue-50 text-blue-600"   },
    { label: "En progreso",       value: tareas.filter((t) => t.estado === "en_progreso").length, icon: Clock,         color: "bg-amber-50 text-amber-600" },
    { label: "Completadas",       value: tareas.filter((t) => t.estado === "completada").length,  icon: CheckCircle,   color: "bg-green-50 text-green-600"  },
    { label: "Pendientes",        value: tareas.filter((t) => t.estado === "pendiente").length,   icon: Users,         color: "bg-purple-50 text-purple-600"},
  ];

  const estadoColor = {
    pendiente:   "bg-gray-100 text-gray-600",
    en_progreso: "bg-amber-100 text-amber-700",
    completada:  "bg-green-100 text-green-700",
    cancelada:   "bg-red-100 text-red-600",
  };

  const estadoLabel = {
    pendiente:   "Pendiente",
    en_progreso: "En progreso",
    completada:  "Completada",
    cancelada:   "Cancelada",
  };

  const handleCalificado = (tarea_id) => {
    setCalificadas((prev) => new Set([...prev, tarea_id]));
    setModalTarea(null);
  };

  const handleCompletar = async (tarea_id) => {
    try {
      await api.patch(`/tareas/${tarea_id}/completar`);
      setTareas((prev) =>
        prev.map((t) => t.id === tarea_id ? { ...t, estado: "completada" } : t)
      );
      setModalCompletar(null);
    } catch (err) {
      alert(err.response?.data?.error || "Error al completar la tarea");
      setModalCompletar(null);
    }
  };

  const handleCancelada = (tarea_id) => {
    setTareas((prev) =>
      prev.map((t) => t.id === tarea_id ? { ...t, estado: "cancelada" } : t)
    );
  };

  return (
    <div className="flex-1 bg-gray-50 px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hola, {user?.nombre} 👋</h1>
            <p className="text-gray-500 mt-1">Gestiona tus solicitudes de servicio</p>
          </div>
          <Link to="/dashboard/cliente/tareas/nueva"
            style={{ backgroundColor: "#10b981" }}
            className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition">
            <Plus className="h-4 w-4" />
            Nueva tarea
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5">
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
            <Link to="/dashboard/cliente/tareas/nueva"
              className="text-sm font-medium hover:underline"
              style={{ color: "#10b981" }}>
              + Nueva
            </Link>
          </div>

          {/* Filtros */}
          {!loading && tareas.length > 0 && (
            <div className="px-6 py-3 border-b border-gray-100 flex gap-2 overflow-x-auto">
              {[
                { key: "todas",      label: "Todas",       count: tareas.length },
                { key: "pendiente",  label: "Pendientes",  count: tareas.filter(t => t.estado === "pendiente").length },
                { key: "en_progreso",label: "En progreso", count: tareas.filter(t => t.estado === "en_progreso").length },
                { key: "completada", label: "Completadas", count: tareas.filter(t => t.estado === "completada").length },
                { key: "cancelada",  label: "Canceladas",  count: tareas.filter(t => t.estado === "cancelada").length },
              ].filter(f => f.key === "todas" || f.count > 0).map((f) => (
                <button key={f.key} onClick={() => setFiltro(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    filtro === f.key
                      ? "text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  style={filtro === f.key ? { backgroundColor: "#10b981" } : {}}>
                  {f.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    filtro === f.key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "#10b981", borderTopColor: "transparent" }} />
            </div>
          ) : tareas.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No tienes tareas aún</p>
              <p className="text-gray-400 text-sm mt-1">Crea tu primera solicitud de servicio</p>
              <Link to="/dashboard/cliente/tareas/nueva"
                style={{ backgroundColor: "#10b981" }}
                className="inline-block mt-4 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition">
                Crear tarea
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tareas
                .filter((t) => filtro === "todas" || t.estado === filtro)
                .map((t) => {
                const yaCalificada = calificadas.has(t.id) || t.calificada;
                return (
                  <div key={t.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{t.titulo}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {t.categoria || "Sin categoría"} ·{" "}
                        {new Date(t.created_at).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${estadoColor[t.estado] || "bg-gray-100 text-gray-600"}`}>
                        {estadoLabel[t.estado] || t.estado}
                      </span>
                      {/* Botón editar — solo tareas pendientes */}
                      {t.estado === "pendiente" && (
                        <Link
                          to={`/dashboard/cliente/tareas/${t.id}/editar`}
                          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Link>
                      )}
                      {/* Botón ayuda — solo tareas en_progreso */}
                      {t.estado === "en_progreso" && (
                        <button
                          onClick={() => setModalAyuda(t)}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                          Ayuda
                        </button>
                      )}
                      {/* Botón completar — SOLO tareas en_progreso */}
                      {t.estado === "en_progreso" && (
                        <button
                          onClick={() => setModalCompletar(t)}
                          className="flex items-center gap-1.5 text-xs font-medium text-green-600 border border-green-200 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Completar
                        </button>
                      )}
                      {/* Botón calificar — solo tareas completadas sin calificar */}
                      {t.estado === "completada" && !yaCalificada && (
                        <button
                          onClick={() => setModalTarea(t)}
                          className="flex items-center gap-1.5 text-xs font-medium text-amber-600 border border-amber-200 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition"
                        >
                          <Star className="h-3.5 w-3.5" />
                          Calificar
                        </button>
                      )}
                      {t.estado === "completada" && yaCalificada && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          Calificada
                        </span>
                      )}
                      {/* Chat — tareas en_progreso o completadas */}
                      {["en_progreso", "completada"].includes(t.estado) && (
                        <Link
                          to={`/chat/${t.id}`}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Chat
                        </Link>
                      )}
                      <Link
                        to={["en_progreso","completada"].includes(t.estado) ? `/tareas/${t.id}` : `/dashboard/cliente/tareas/${t.id}`}
                        className="text-xs font-medium text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition"
                        style={{ backgroundColor: "#10b981" }}>
                        {["en_progreso","completada"].includes(t.estado) ? "Ver detalle" : "Postulaciones"}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal calificar */}
      {modalTarea && (
        <ModalCalificar
          tarea={modalTarea}
          onClose={() => setModalTarea(null)}
          onCalificado={handleCalificado}
        />
      )}

      {/* Modal confirmar completar */}
      {modalCompletar && (
        <ModalCompletar
          tarea={modalCompletar}
          onClose={() => setModalCompletar(null)}
          onConfirmar={handleCompletar}
        />
      )}

      {/* Modal ayuda */}
      {modalAyuda && (
        <ModalAyuda
          tarea={modalAyuda}
          onClose={() => setModalAyuda(null)}
          onCancelada={handleCancelada}
        />
      )}
    </div>
  );
}
