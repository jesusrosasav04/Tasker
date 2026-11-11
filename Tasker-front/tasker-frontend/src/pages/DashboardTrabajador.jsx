import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase, ClipboardList, CheckCircle, Star,
  MapPin, DollarSign, X, User, MessageSquare, Eye, Receipt,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import SkeletonLista, { ErrorCarga } from "../components/Skeleton";

// ── Constantes ────────────────────────────────────────
const TABS = [
  { id: "disponibles", label: "Tareas disponibles", icon: Briefcase },
  { id: "postulaciones", label: "Mis postulaciones", icon: ClipboardList },
  { id: "aceptadas", label: "Tareas aceptadas", icon: CheckCircle },
  { id: "calificaciones", label: "Mis calificaciones", icon: Star },
];

const estadoPostulacionStyle = {
  pendiente: "bg-stone-100 text-piedra",
  aceptada: "bg-menta text-primary",
  rechazada: "bg-red-100 text-red-500",
};

const estadoTareaStyle = {
  pendiente: "bg-stone-100 text-piedra",
  en_progreso: "bg-amber-100 text-amber-700",
  completada: "bg-menta text-primary",
  cancelada: "bg-red-100 text-red-500",
  disputa: "bg-red-50 text-red-700",
};


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
        <div className="flex items-start justify-between p-6 border-b border-arena">
          <div>
            <h3 className="font-display font-semibold text-tinta">Postularme a tarea</h3>
            <p className="text-sm text-piedra mt-0.5 line-clamp-1">
              {tarea.titulo}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-stone-700 block mb-1.5">
              Precio propuesto{" "}
              <span className="text-stone-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.precio_propuesto}
                onChange={(e) =>
                  setForm({ ...form, precio_propuesto: e.target.value })
                }
                placeholder="0.00"
                className="w-full pl-9 border border-arena rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700 block mb-1.5">
              Mensaje para el cliente{" "}
              <span className="text-stone-400 font-normal">(opcional)</span>
            </label>
            <textarea
              rows={3}
              value={form.mensaje}
              onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
              placeholder="Preséntate y explica por qué eres el indicado..."
              className="w-full border border-arena rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none"
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
              className="flex-1 border border-arena text-stone-700 py-2.5 rounded-xl text-sm font-medium hover:bg-crema transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary-dark flex-1 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
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
  const [tareas, setTareas]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [page, setPage]           = useState(1);
  const [hayMas, setHayMas]       = useState(false);
  const [verificado, setVerificado] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/tareas/disponibles?page=${page}&limit=20`)
      .then((r) => {
        const data = r.data.data?.tareas || [];
        setTareas((prev) => (page === 1 ? data : [...prev, ...data]));
        setHayMas(data.length === 20);
        if (r.data.data?.verificado !== undefined) {
          setVerificado(r.data.data.verificado);
        }
      })
      .catch(() => setErrorCarga("No se pudieron cargar las tareas disponibles."))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading && page === 1) return <SkeletonLista />;
  if (errorCarga && tareas.length === 0) return <ErrorCarga mensaje={errorCarga} />;

  if (!verificado)
    return (
      <div className="text-center py-16 px-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 mx-auto mb-4">
          <span className="text-3xl">⏳</span>
        </div>
        <p className="text-tinta font-semibold text-lg">Perfil pendiente de verificación</p>
        <p className="text-piedra text-sm mt-2 max-w-sm mx-auto">
          Un administrador debe aprobar tu perfil antes de que puedas postularte a tareas.
          Recibirás una notificación cuando sea aprobado.
        </p>
      </div>
    );

  if (tareas.length === 0)
    return (
      <div className="text-center py-16">
        <Briefcase className="h-12 w-12 text-stone-300 mx-auto mb-3" />
        <p className="text-piedra font-medium">No hay tareas disponibles</p>
        <p className="text-stone-400 text-sm mt-1">
          Vuelve más tarde para ver nuevas oportunidades
        </p>
      </div>
    );

  return (
    <div>
      <div className="divide-y divide-arena">
        {tareas.map((t) => {
          const yaPostulado = postuladas.has(t.id);
          return (
            <div key={t.id} className="px-6 py-5 hover:bg-crema transition">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-tinta">{t.titulo}</p>
                  <p className="text-sm text-piedra mt-0.5 line-clamp-2">
                    {t.descripcion}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-400">
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
                    <span className="text-sm font-semibold text-primary">
                      ${Number(t.presupuesto).toLocaleString("es-MX")}
                    </span>
                  )}
                  <button
                    onClick={() => !yaPostulado && onPostular(t)}
                    disabled={yaPostulado}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                      yaPostulado
                        ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                        : "bg-primary text-white hover:bg-primary-dark"
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
        <div className="px-6 py-4 border-t border-arena">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
            className="w-full text-sm text-piedra hover:text-stone-700 font-medium py-2 transition"
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
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    api
      .get("/postulaciones/mis-postulaciones")
      .then((r) => setPostulaciones(r.data.data || []))
      .catch(() => setErrorCarga("No se pudieron cargar tus postulaciones."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonLista />;
  if (errorCarga) return <ErrorCarga mensaje={errorCarga} />;

  if (postulaciones.length === 0)
    return (
      <div className="text-center py-16">
        <ClipboardList className="h-12 w-12 text-stone-300 mx-auto mb-3" />
        <p className="text-piedra font-medium">No tienes postulaciones aún</p>
        <p className="text-stone-400 text-sm mt-1">
          Postúlate a tareas disponibles para verlas aquí
        </p>
      </div>
    );

  return (
    <div className="divide-y divide-arena">
      {postulaciones.map((p) => (
        <div key={p.id} className="px-6 py-4 hover:bg-crema transition">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-tinta truncate">{p.titulo}</p>
              <p className="text-xs text-stone-400 mt-0.5">
                {p.categoria} ·{" "}
                {new Date(p.created_at).toLocaleDateString("es-MX")}
              </p>
              {p.precio_propuesto && p.estado !== "rechazada" && (
                <p className="text-sm text-primary font-medium mt-1">
                  Tu oferta: $
                  {Number(p.precio_propuesto).toLocaleString("es-MX")}
                </p>
              )}
              {p.mensaje && p.estado !== "rechazada" && (
                <p className="text-sm text-piedra mt-1 line-clamp-1">
                  "{p.mensaje}"
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoPostulacionStyle[p.estado] || "bg-stone-100 text-piedra"}`}
              >
                {p.estado === "aceptada"
                  ? "Aceptada ✓"
                  : p.estado === "rechazada"
                    ? "Rechazada"
                    : "Pendiente"}
              </span>
              {/* Solo mostrar estado de tarea si la postulación NO fue rechazada */}
              {p.estado !== "rechazada" && (
                <span
                  className={`text-xs px-2.5 py-1 rounded-full ${estadoTareaStyle[p.tarea_estado] || "bg-stone-100 text-piedra"}`}
                >
                  Tarea: {p.tarea_estado?.replace("_", " ")}
                </span>
              )}
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
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    api
      .get("/trabajadores/mis-tareas")
      .then((r) => setTareas(r.data.data || []))
      .catch(() => setErrorCarga("No se pudieron cargar tus trabajos."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonLista />;
  if (errorCarga) return <ErrorCarga mensaje={errorCarga} />;

  if (tareas.length === 0)
    return (
      <div className="text-center py-16">
        <CheckCircle className="h-12 w-12 text-stone-300 mx-auto mb-3" />
        <p className="text-piedra font-medium">No tienes tareas asignadas</p>
        <p className="text-stone-400 text-sm mt-1">
          Cuando un cliente acepte tu postulación aparecerá aquí
        </p>
      </div>
    );

  return (
    <div className="divide-y divide-arena">
      {tareas.map((t) => (
        <div key={t.id} className="px-6 py-4 hover:bg-crema transition">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-tinta">{t.titulo}</p>
              <p className="text-sm text-piedra mt-0.5 line-clamp-1">
                {t.descripcion}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-stone-400">
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
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoTareaStyle[t.estado] || "bg-stone-100 text-piedra"}`}
              >
                {t.estado?.replace("_", " ")}
              </span>
              {t.precio_propuesto && (
                <span className="text-sm font-semibold text-primary">
                  ${Number(t.precio_propuesto).toLocaleString("es-MX")}
                </span>
              )}
              <Link
                to={`/chat/${t.id}`}
                className="flex items-center gap-1.5 text-xs font-medium text-piedra border border-arena px-3 py-1.5 rounded-lg hover:bg-stone-100 transition"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </Link>
              <Link
                to={`/tareas/${t.id}`}
                className="bg-primary hover:bg-primary-dark flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 rounded-lg transition"
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
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    api
      .get("/trabajadores/mis-calificaciones")
      .then((r) => setCalificaciones(r.data.data || []))
      .catch(() => setErrorCarga("No se pudieron cargar tus calificaciones."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonLista />;
  if (errorCarga) return <ErrorCarga mensaje={errorCarga} />;

  if (calificaciones.length === 0)
    return (
      <div className="text-center py-16">
        <Star className="h-12 w-12 text-stone-300 mx-auto mb-3" />
        <p className="text-piedra font-medium">
          Aún no tienes calificaciones
        </p>
        <p className="text-stone-400 text-sm mt-1">
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
                className={`h-4 w-4 ${n <= Math.round(promedio) ? "text-amber-400 fill-amber-400" : "text-stone-300"}`}
              />
            ))}
          </div>
          <p className="text-sm text-amber-700 mt-0.5">
            Basado en {calificaciones.length} reseña
            {calificaciones.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <div className="divide-y divide-arena">
        {calificaciones.map((c, i) => (
          <div key={i} className="px-6 py-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-tinta">
                  {c.cliente_nombre}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">{c.tarea}</p>
              </div>
              <div className="flex gap-0.5 flex-shrink-0">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${n <= c.puntuacion ? "text-amber-400 fill-amber-400" : "text-stone-200"}`}
                  />
                ))}
              </div>
            </div>
            {c.comentario && (
              <p className="text-sm text-piedra mt-2 leading-relaxed">
                "{c.comentario}"
              </p>
            )}
            <p className="text-xs text-stone-400 mt-1.5">
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
      .catch((err) => console.error("No se pudo cargar mis postulaciones", err));
  }, []);

  const handlePostulacionExitosa = useCallback((tarea_id) => {
    setPostuladas((prev) => new Set([...prev, tarea_id]));
    setModalTarea(null);
  }, []);

  return (
    <div className="flex-1 bg-crema px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-tinta">
              Hola, {user?.nombre} 👋
            </h1>
            <p className="text-piedra mt-1 text-sm">
              Encuentra tareas y gestiona tu trabajo
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
          <Link
            to="/pagos"
            className="flex items-center gap-2 rounded-xl border border-arena bg-white px-4 py-2.5 text-sm font-medium text-tinta transition hover:border-stone-400"
          >
            <Receipt className="h-4 w-4" />
            Pagos recibidos
          </Link>
          <Link
            to="/dashboard/trabajador/perfil"
            className="flex items-center gap-2 border border-arena text-stone-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-100 transition"
          >
            <User className="h-4 w-4" />
            Mi perfil
          </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-arena overflow-hidden">
          <div className="flex overflow-x-auto border-b border-arena">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const activo = tabActivo === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTabActivo(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activo
                      ? "border-primary text-primary"
                      : "border-transparent text-piedra hover:text-stone-700 hover:border-arena"
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
