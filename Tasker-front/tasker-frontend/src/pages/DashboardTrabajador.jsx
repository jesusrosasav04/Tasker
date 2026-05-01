import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase, ClipboardList, CheckCircle, Star,
  MapPin, DollarSign, X, User, MessageSquare, Eye,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

// ── Constantes ────────────────────────────────────────
const TABS = [
  { id: "disponibles", label: "Tareas disponibles", icon: Briefcase },
  { id: "postulaciones", label: "Mis postulaciones", icon: ClipboardList },
  { id: "aceptadas", label: "Tareas aceptadas", icon: CheckCircle },
  { id: "calificaciones", label: "Mis calificaciones", icon: Star },
];

const estadoPostulacionStyle = {
  pendiente: "bg-gray-100 text-gray-600",
  aceptada: "bg-green-100 text-green-700",
  rechazada: "bg-red-100 text-red-500",
};

const estadoTareaStyle = {
  pendiente: "bg-gray-100 text-gray-600",
  en_progreso: "bg-amber-100 text-amber-700",
  completada: "bg-green-100 text-green-700",
  cancelada: "bg-red-100 text-red-500",
};

// ── Spinner ───────────────────────────────────────────
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

// ── Modal postularse ──────────────────────────────────
function ModalPostularse({ tarea, onClose, onSuccess }) {
  const [form, setForm] = useState({ mensaje: "", precio_propuesto: "" });
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");
    setLoading(true);
    try {
      await api.post("/postulaciones", {
        tarea_id: tarea.id,
        ...(form.mensaje && { mensaje: form.mensaje }),
        ...(form.precio_propuesto && {
          precio_propuesto: parseFloat(form.precio_propuesto),
        }),
      });
      onSuccess(tarea.id);
    } catch (err) {
      const status = err.response?.status;
      if (status === 409)
        setErrMsg("Ya te postulaste a esta tarea anteriormente.");
      else if (status === 429)
        setErrMsg("Demasiadas solicitudes, intenta más tarde.");
      else
        setErrMsg(err.response?.data?.error || "Error al enviar postulación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Postularme a tarea</h3>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
              {tarea.titulo}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Precio propuesto{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.precio_propuesto}
                onChange={(e) =>
                  setForm({ ...form, precio_propuesto: e.target.value })
                }
                placeholder="0.00"
                className="w-full pl-9 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Mensaje para el cliente{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              rows={3}
              value={form.mensaje}
              onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
              placeholder="Preséntate y explica por qué eres el indicado..."
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none"
            />
          </div>
          {errMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {errMsg}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: "#10b981" }}
              className="flex-1 text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar postulación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tab: Tareas disponibles ───────────────────────────
function TabDisponibles({ postuladas, onPostular }) {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hayMas, setHayMas] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/tareas/disponibles?page=${page}&limit=20`)
      .then((r) => {
        const data = r.data.data?.tareas || [];
        setTareas((prev) => (page === 1 ? data : [...prev, ...data]));
        setHayMas(data.length === 20);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  if (loading && page === 1) return <Spinner />;

  if (tareas.length === 0)
    return (
      <div className="text-center py-16">
        <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No hay tareas disponibles</p>
        <p className="text-gray-400 text-sm mt-1">
          Vuelve más tarde para ver nuevas oportunidades
        </p>
      </div>
    );

  return (
    <div>
      <div className="divide-y divide-gray-100">
        {tareas.map((t) => {
          const yaPostulado = postuladas.has(t.id);
          return (
            <div key={t.id} className="px-6 py-5 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{t.titulo}</p>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                    {t.descripcion}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>📁 {t.categoria}</span>
                    {t.ubicacion && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {t.ubicacion}
                      </span>
                    )}
                    <span>
                      {new Date(t.created_at).toLocaleDateString("es-MX")}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {t.presupuesto && (
                    <span className="text-sm font-semibold text-emerald-600">
                      ${Number(t.presupuesto).toLocaleString("es-MX")}
                    </span>
                  )}
                  <button
                    onClick={() => !yaPostulado && onPostular(t)}
                    disabled={yaPostulado}
                    style={!yaPostulado ? { backgroundColor: "#10b981" } : {}}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                      yaPostulado
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "text-white hover:opacity-90"
                    }`}
                  >
                    {yaPostulado ? "Ya postulado" : "Postularme"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {hayMas && (
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
            className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium py-2 transition"
          >
            {loading ? "Cargando..." : "Ver más tareas"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tab: Mis postulaciones ────────────────────────────
function TabMisPostulaciones() {
  const [postulaciones, setPostulaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/postulaciones/mis-postulaciones")
      .then((r) => setPostulaciones(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  if (postulaciones.length === 0)
    return (
      <div className="text-center py-16">
        <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No tienes postulaciones aún</p>
        <p className="text-gray-400 text-sm mt-1">
          Postúlate a tareas disponibles para verlas aquí
        </p>
      </div>
    );

  return (
    <div className="divide-y divide-gray-100">
      {postulaciones.map((p) => (
        <div key={p.id} className="px-6 py-4 hover:bg-gray-50 transition">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 truncate">{p.titulo}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {p.categoria} ·{" "}
                {new Date(p.created_at).toLocaleDateString("es-MX")}
              </p>
              {p.precio_propuesto && (
                <p className="text-sm text-emerald-600 font-medium mt-1">
                  Tu oferta: $
                  {Number(p.precio_propuesto).toLocaleString("es-MX")}
                </p>
              )}
              {p.mensaje && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                  "{p.mensaje}"
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoPostulacionStyle[p.estado] || "bg-gray-100 text-gray-600"}`}
              >
                {p.estado === "aceptada"
                  ? "Aceptada ✓"
                  : p.estado === "rechazada"
                    ? "Rechazada"
                    : "Pendiente"}
              </span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full ${estadoTareaStyle[p.tarea_estado] || "bg-gray-100 text-gray-500"}`}
              >
                Tarea: {p.tarea_estado?.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab: Tareas aceptadas ─────────────────────────────
function TabTareasAceptadas() {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/trabajadores/mis-tareas")
      .then((r) => setTareas(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  if (tareas.length === 0)
    return (
      <div className="text-center py-16">
        <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No tienes tareas asignadas</p>
        <p className="text-gray-400 text-sm mt-1">
          Cuando un cliente acepte tu postulación aparecerá aquí
        </p>
      </div>
    );

  return (
    <div className="divide-y divide-gray-100">
      {tareas.map((t) => (
        <div key={t.id} className="px-6 py-4 hover:bg-gray-50 transition">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">{t.titulo}</p>
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                {t.descripcion}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-400">
                <span>📁 {t.categoria}</span>
                {t.ubicacion && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {t.ubicacion}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> {t.cliente_nombre}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoTareaStyle[t.estado] || "bg-gray-100 text-gray-600"}`}
              >
                {t.estado?.replace("_", " ")}
              </span>
              {t.precio_propuesto && (
                <span className="text-sm font-semibold text-emerald-600">
                  ${Number(t.precio_propuesto).toLocaleString("es-MX")}
                </span>
              )}
              <Link
                to={`/chat/${t.id}`}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </Link>
              <Link
                to={`/tareas/${t.id}`}
                style={{ backgroundColor: "#10b981" }}
                className="flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition"
              >
                <Eye className="h-3.5 w-3.5" />
                Ver detalle
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab: Mis calificaciones ───────────────────────────
function TabCalificaciones() {
  const [calificaciones, setCalificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/trabajadores/mis-calificaciones")
      .then((r) => setCalificaciones(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  if (calificaciones.length === 0)
    return (
      <div className="text-center py-16">
        <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">
          Aún no tienes calificaciones
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Completa tareas para recibir reseñas de tus clientes
        </p>
      </div>
    );

  const promedio =
    calificaciones.reduce((acc, c) => acc + Number(c.puntuacion), 0) /
    calificaciones.length;

  return (
    <div>
      <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex items-center gap-4">
        <div className="text-4xl font-bold text-amber-600">
          {promedio.toFixed(1)}
        </div>
        <div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`h-4 w-4 ${n <= Math.round(promedio) ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
              />
            ))}
          </div>
          <p className="text-sm text-amber-700 mt-0.5">
            Basado en {calificaciones.length} reseña
            {calificaciones.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {calificaciones.map((c, i) => (
          <div key={i} className="px-6 py-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {c.cliente_nombre}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{c.tarea}</p>
              </div>
              <div className="flex gap-0.5 flex-shrink-0">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${n <= c.puntuacion ? "text-amber-400 fill-amber-400" : "text-gray-200"}`}
                  />
                ))}
              </div>
            </div>
            {c.comentario && (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                "{c.comentario}"
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1.5">
              {new Date(c.created_at).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────
export default function DashboardTrabajador() {
  const { user } = useAuth();
  const [tabActivo, setTabActivo] = useState("disponibles");
  const [modalTarea, setModalTarea] = useState(null);
  const [postuladas, setPostuladas] = useState(new Set());

  useEffect(() => {
    api
      .get("/postulaciones/mis-postulaciones")
      .then((r) => {
        const ids = new Set((r.data.data || []).map((p) => p.tarea_id ?? p.id));
        setPostuladas(ids);
      })
      .catch(() => {});
  }, []);

  const handlePostulacionExitosa = useCallback((tarea_id) => {
    setPostuladas((prev) => new Set([...prev, tarea_id]));
    setModalTarea(null);
  }, []);

  return (
    <div className="flex-1 bg-gray-50 px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hola, {user?.nombre} 👋
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Encuentra tareas y gestiona tu trabajo
            </p>
          </div>
          <Link
            to="/dashboard/trabajador/perfil"
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition"
          >
            <User className="h-4 w-4" />
            Mi perfil
          </Link>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-100">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const activo = tabActivo === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTabActivo(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activo
                      ? "border-emerald-500 text-emerald-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {tabActivo === "disponibles" && (
            <TabDisponibles
              postuladas={postuladas}
              onPostular={(t) => setModalTarea(t)}
            />
          )}
          {tabActivo === "postulaciones" && <TabMisPostulaciones />}
          {tabActivo === "aceptadas" && <TabTareasAceptadas />}
          {tabActivo === "calificaciones" && <TabCalificaciones />}
        </div>
      </div>

      {modalTarea && (
        <ModalPostularse
          tarea={modalTarea}
          onClose={() => setModalTarea(null)}
          onSuccess={handlePostulacionExitosa}
        />
      )}
    </div>
  );
}
