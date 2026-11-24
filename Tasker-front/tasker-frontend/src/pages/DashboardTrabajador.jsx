import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Briefcase, ClipboardList, CheckCircle, Star,
  MapPin, DollarSign, X, User, MessageSquare, Eye, Receipt,
  Tag, Clock, Coins, Lock, Camera,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import SkeletonLista, { ErrorCarga } from "../components/Skeleton";

// ── Constantes ────────────────────────────────────────
const TABS = [
  { id: "disponibles", label: "Disponibles", icon: Briefcase },
  { id: "postulaciones", label: "Mis postulaciones", icon: ClipboardList },
  { id: "aceptadas", label: "Mis trabajos", icon: CheckCircle },
  { id: "calificaciones", label: "Calificaciones", icon: Star },
];

const estadoPostulacionStyle = {
  pendiente: "bg-stone-100 text-piedra",
  aceptada: "bg-menta text-primary",
  rechazada: "bg-red-100 text-red-500",
};

const ESTADO_TAREA_LABEL = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  entregado: "Entregado · por aprobar",
  completada: "Completada",
  cancelada: "Cancelada",
  disputa: "En disputa",
};

const estadoTareaStyle = {
  pendiente: "bg-stone-100 text-piedra",
  en_progreso: "bg-miel text-miel-dark",
  entregado: "bg-sky-100 text-sky-800",
  completada: "bg-menta text-primary",
  cancelada: "bg-red-100 text-red-500",
  disputa: "bg-red-50 text-red-700",
};

const EN_CURSO = ["en_progreso", "entregado"];
const PUNTOS = {
  backgroundImage: "radial-gradient(rgba(250,247,242,0.08) 1.5px, transparent 1.5px)",
  backgroundSize: "22px 22px",
};

const pesos = (n) => `$${Number(n).toLocaleString("es-MX")}`;

// "hace 2 horas" pesa más que una fecha: dice si vale la pena correr por ella
const hace = (iso) => {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 60) return min <= 1 ? "hace un momento" : `hace ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return horas === 1 ? "hace 1 hora" : `hace ${horas} horas`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
};
const esReciente = (iso) => Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000;

// Trabajos asignados: los usan la columna lateral y la pestaña, así que se piden una vez
function useMisTareas() {
  const [estado, setEstado] = useState({ datos: [], loading: true, error: "" });
  useEffect(() => {
    api.get("/trabajadores/mis-tareas")
      .then((r) => setEstado({ datos: r.data.data || [], loading: false, error: "" }))
      .catch(() => setEstado({ datos: [], loading: false, error: "No se pudieron cargar tus trabajos." }));
  }, []);
  return estado;
}

// ── Portada ───────────────────────────────────────────
function Portada({ nombre, stats, perfil, categorias }) {
  const verificado = !!perfil?.verificado;
  const disponibles = (stats?.gratis_restantes || 0) + (stats?.creditos || 0);
  const listos = [!!perfil?.telefono, !!perfil?.curp, perfil?.identificacion === "verificada"].filter(Boolean).length;

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-tinta px-7 py-8 sm:px-10 sm:py-9">
      <div aria-hidden="true" className="absolute inset-0" style={PUNTOS} />
      <div className="relative flex flex-wrap items-end justify-between gap-8">

        <div className="min-w-0 flex-[999_1_380px]">
          {verificado ? (
            <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wider text-teal-300">
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
              Especialista verificado
            </p>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wider text-miel">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Falta un paso
            </p>
          )}

          <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-[-0.035em] text-crema sm:text-5xl">
            Hola, {nombre?.split(" ")[0] || "especialista"}
          </h1>

          {verificado ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {categorias.slice(0, 2).map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-crema/20 px-3.5 py-1.5 text-[13px] text-stone-300">
                  <Tag className="h-3 w-3" aria-hidden="true" /> {c}
                </span>
              ))}
              {categorias.length > 2 && (
                <span className="inline-flex items-center rounded-full border border-crema/20 px-3.5 py-1.5 text-[13px] text-stone-300">
                  +{categorias.length - 2}
                </span>
              )}
              {stats?.calificacion_promedio && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-crema/20 px-3.5 py-1.5 text-[13px] text-stone-300">
                  <Star className="h-3 w-3 fill-miel text-miel" aria-hidden="true" />
                  {stats.calificacion_promedio} · {stats.calificaciones}{" "}
                  {stats.calificaciones === 1 ? "reseña" : "reseñas"}
                </span>
              )}
            </div>
          ) : (
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-stone-300">
              Para que los clientes confíen, revisamos la identidad de cada especialista. Hasta que tu
              perfil esté aprobado no puedes ver ni postularte a tareas.
            </p>
          )}
        </div>

        <div className="min-w-0 flex-[1_1_300px] rounded-[22px] border border-crema/15 bg-crema/[0.07] p-5 sm:p-6">
          {verificado ? (
            <>
              <p className="text-[13px] text-stone-300">Postulaciones disponibles</p>
              <p className="mt-2 flex items-baseline gap-2.5">
                <span className="font-display text-5xl font-extrabold leading-none tracking-[-0.04em] text-crema">
                  {disponibles}
                </span>
                <span className="text-[13px] text-stone-300">
                  {stats?.gratis_restantes || 0} gratis · {stats?.creditos || 0} de créditos
                </span>
              </p>
              {disponibles > 0 && (
                <div aria-hidden="true" className="mt-4 flex gap-1">
                  <span className="h-1.5 rounded-full bg-teal-300" style={{ flex: Math.max(stats?.gratis_restantes || 0, 0.001) }} />
                  <span className="h-1.5 rounded-full bg-crema/25" style={{ flex: Math.max(stats?.creditos || 0, 0.001) }} />
                </div>
              )}
              <Link to="/mi-plan"
                className="mt-5 flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-miel text-[15px] font-bold text-tinta transition hover:bg-amber-200">
                <Coins className="h-4 w-4" aria-hidden="true" />
                {disponibles === 0 ? "Comprar créditos para seguir" : "Comprar créditos"}
              </Link>
            </>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[13px] text-stone-300">Tu verificación</p>
                <p className="text-[13px] font-bold text-crema">{listos} de 3</p>
              </div>
              <div aria-hidden="true" className="mt-3 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${i < listos ? "bg-teal-300" : "bg-crema/25"}`} />
                ))}
              </div>
              <ul className="mt-4 space-y-2.5">
                <Requisito ok={!!perfil?.telefono} label="Teléfono" />
                <Requisito ok={!!perfil?.curp} label="CURP" />
                <Requisito
                  ok={perfil?.identificacion === "verificada"}
                  revision={perfil?.identificacion === "en_revision"}
                  label="Identificación oficial"
                />
              </ul>
              <Link to="/dashboard/trabajador/perfil"
                className="mt-5 flex min-h-[46px] items-center justify-center rounded-2xl bg-miel text-[15px] font-bold text-tinta transition hover:bg-amber-200">
                Completar mi perfil
              </Link>
            </>
          )}
        </div>

      </div>
    </section>
  );
}

function Requisito({ ok, revision, label }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      {ok ? (
        <CheckCircle className="h-4 w-4 flex-shrink-0 text-teal-300" aria-hidden="true" />
      ) : (
        <Clock className={`h-4 w-4 flex-shrink-0 ${revision ? "text-miel" : "text-stone-500"}`} aria-hidden="true" />
      )}
      <span className={ok ? "text-crema" : "text-stone-300"}>{label}</span>
      <span className={`text-xs ${revision ? "text-miel" : "text-stone-500"}`}>
        {ok ? "(listo)" : revision ? "(en revisión)" : "(pendiente)"}
      </span>
    </li>
  );
}

// ── Columna lateral ───────────────────────────────────
function RailTrabajos({ tareas, loading, onVerTodos }) {
  const enCurso = tareas.filter((t) => EN_CURSO.includes(t.estado));
  if (loading || enCurso.length === 0) return null;

  return (
    <section className="rounded-[20px] border border-arena bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-[17px] font-extrabold text-tinta">Trabajos en curso</h2>
        <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-tinta px-1.5 text-xs font-bold text-crema">
          {enCurso.length}
        </span>
      </div>

      <ul className="mt-4 divide-y divide-arena">
        {enCurso.slice(0, 3).map((t) => (
          <li key={t.id} className="py-4 first:pt-0 last:pb-0">
            <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${estadoTareaStyle[t.estado]}`}>
              {ESTADO_TAREA_LABEL[t.estado]}
            </span>
            <p className="mt-2 text-sm font-semibold text-tinta">{t.titulo}</p>
            <p className="mt-0.5 text-xs text-piedra">
              {t.precio_propuesto ? `Acordado en ${pesos(t.precio_propuesto)}` : "Sin precio acordado"} · {t.cliente_nombre}
            </p>
            {t.estado === "en_progreso" ? (
              <Link to={`/tareas/${t.id}`}
                className="mt-3 flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-tinta text-sm font-semibold text-crema transition hover:bg-stone-700">
                <Camera className="h-4 w-4" aria-hidden="true" />
                Entregar con foto
              </Link>
            ) : (
              <p className="mt-2 text-xs text-piedra">Esperando a que {t.cliente_nombre?.split(" ")[0]} lo apruebe.</p>
            )}
          </li>
        ))}
      </ul>

      {enCurso.length > 3 && (
        <button type="button" onClick={onVerTodos}
          className="mt-4 text-sm font-semibold text-primary hover:text-primary-dark">
          Ver los {enCurso.length} trabajos →
        </button>
      )}
    </section>
  );
}

function RailReputacion({ stats }) {
  if (!stats) return null;
  const prom = stats.calificacion_promedio;

  return (
    <section className="rounded-[20px] border border-arena bg-white p-5">
      <h2 className="font-display text-[17px] font-extrabold text-tinta">Tu reputación</h2>

      <div className="mt-4 flex items-center gap-3.5">
        <span className="font-display text-[44px] font-extrabold leading-none tracking-[-0.03em] text-tinta">
          {prom ? prom.toFixed(1) : "—"}
        </span>
        <div>
          <div aria-hidden="true" className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={`h-4 w-4 ${prom && n <= Math.round(prom) ? "fill-miel text-miel-dark" : "text-stone-300"}`} />
            ))}
          </div>
          <p className="mt-1.5 text-[13px] text-piedra">
            {stats.calificaciones === 0
              ? "Aún sin reseñas"
              : `${stats.calificaciones} ${stats.calificaciones === 1 ? "reseña" : "reseñas"} de clientes`}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-arena pt-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[13px] text-piedra">Postulaciones aceptadas</span>
          <span className="text-[15px] font-bold text-tinta">{stats.tasa_exito}%</span>
        </div>
        <div aria-hidden="true" className="mt-2 flex gap-0.5">
          <span className="h-1.5 rounded-full bg-primary" style={{ flex: Math.max(stats.tasa_exito, 0.001) }} />
          <span className="h-1.5 rounded-full bg-arena" style={{ flex: Math.max(100 - stats.tasa_exito, 0.001) }} />
        </div>
      </div>

      <Link to="/estadisticas" className="mt-4 block text-sm font-semibold text-primary hover:text-primary-dark">
        Ver mis estadísticas →
      </Link>
    </section>
  );
}

// ── Modal postularse ──────────────────────────────────
function ModalPostularse({ tarea, onClose, onSuccess }) {
  const [form, setForm] = useState({ mensaje: "", precio_propuesto: "" });
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [sinCreditos, setSinCreditos] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");
    setSinCreditos(false);
    setLoading(true);
    try {
      await api.post("/postulaciones", {
        tarea_id: tarea.id,
        ...(form.mensaje && { mensaje: form.mensaje }),
        ...(form.precio_propuesto && { precio_propuesto: parseFloat(form.precio_propuesto) }),
      });
      onSuccess(tarea.id);
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setErrMsg("Ya te postulaste a esta tarea anteriormente.");
      else if (status === 429) setErrMsg("Demasiadas solicitudes, intenta más tarde.");
      else if (status === 402) {
        setErrMsg(err.response?.data?.error || "Te quedaste sin postulaciones disponibles.");
        setSinCreditos(true);
      } else setErrMsg(err.response?.data?.error || "Error al enviar postulación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-arena p-6">
          <div>
            <h3 className="font-display font-semibold text-tinta">Postularme a tarea</h3>
            <p className="mt-0.5 line-clamp-1 text-sm text-piedra">{tarea.titulo}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              Precio propuesto <span className="font-normal text-stone-400">(opcional)</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input type="number" min="0" step="0.01" value={form.precio_propuesto}
                onChange={(e) => setForm({ ...form, precio_propuesto: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-xl border border-arena py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              Mensaje para el cliente <span className="font-normal text-stone-400">(opcional)</span>
            </label>
            <textarea rows={3} value={form.mensaje}
              onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
              placeholder="Preséntate y explica por qué eres el indicado..."
              className="w-full resize-none rounded-xl border border-arena px-4 py-2.5 text-sm focus:outline-none focus:ring-2" />
          </div>
          {errMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errMsg}
              {sinCreditos && (
                <Link to="/mi-plan" className="mt-2 block font-semibold underline">Comprar créditos</Link>
              )}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-arena py-2.5 text-sm font-medium text-stone-700 transition hover:bg-crema">
              Cerrar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-50">
              {loading ? "Enviando..." : "Enviar postulación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tab: Tareas disponibles ───────────────────────────
function TareaCard({ t, yaPostulado, onPostular }) {
  return (
    <article className="rounded-[20px] border border-arena bg-white p-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-menta px-3 py-1 text-xs font-semibold text-menta-dark">
          <Tag className="h-3 w-3" aria-hidden="true" /> {t.categoria}
        </span>
        {esReciente(t.created_at) && (
          <span className="rounded-full bg-miel px-3 py-1 text-xs font-bold text-miel-dark">Nueva</span>
        )}
        <span className="ml-auto text-xs text-piedra">{hace(t.created_at)}</span>
      </div>

      <h2 className="mt-3.5 font-display text-lg font-semibold tracking-[-0.01em] text-tinta">{t.titulo}</h2>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-piedra">{t.descripcion}</p>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-piedra">
        {t.ubicacion && (
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{t.ubicacion}</span>
        )}
        {t.cliente_nombre && (
          <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" aria-hidden="true" />{t.cliente_nombre}</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3.5 border-t border-arena pt-4">
        <div>
          <span className="block text-[11px] font-medium uppercase tracking-wider text-piedra">Presupuesto</span>
          <span className="mt-0.5 block font-display text-2xl font-extrabold tracking-[-0.02em] text-primary">
            {t.presupuesto ? pesos(t.presupuesto) : "A convenir"}
          </span>
        </div>
        {yaPostulado ? (
          <span className="inline-flex min-h-[46px] items-center gap-2 rounded-2xl border border-arena bg-crema px-5 text-[15px] font-medium text-piedra">
            <CheckCircle className="h-4 w-4" aria-hidden="true" /> Ya te postulaste
          </span>
        ) : (
          <button onClick={() => onPostular(t)}
            className="inline-flex min-h-[46px] items-center rounded-2xl bg-primary px-6 text-[15px] font-semibold text-white transition hover:bg-primary-dark">
            Postularme
          </button>
        )}
      </div>
    </article>
  );
}

function TabDisponibles({ postuladas, onPostular }) {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [page, setPage] = useState(1);
  const [hayMas, setHayMas] = useState(false);
  const [verificado, setVerificado] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/tareas/disponibles?page=${page}&limit=20`)
      .then((r) => {
        const data = r.data.data?.tareas || [];
        setTareas((prev) => (page === 1 ? data : [...prev, ...data]));
        setHayMas(data.length === 20);
        if (r.data.data?.verificado !== undefined) setVerificado(r.data.data.verificado);
      })
      .catch(() => setErrorCarga("No se pudieron cargar las tareas disponibles."))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading && page === 1) return <SkeletonLista />;
  if (errorCarga && tareas.length === 0) return <ErrorCarga mensaje={errorCarga} />;

  // Sin verificar: se intuye que hay trabajo, pero no se puede leer ni tomar
  if (!verificado)
    return (
      <div className="relative overflow-hidden rounded-[20px] border border-arena bg-white">
        <div aria-hidden="true" className="space-y-7 p-6 opacity-25 blur-[3px]">
          {[0, 1].map((i) => (
            <div key={i}>
              <div className="flex items-center gap-2">
                <span className="h-6 w-24 rounded-full bg-menta" />
                <span className="ml-auto h-3.5 w-16 rounded-full bg-arena" />
              </div>
              <div className="mt-3.5 h-5 w-3/5 rounded bg-tinta/60" />
              <div className="mt-2.5 h-3 w-5/6 rounded bg-piedra/40" />
              <div className="mt-1.5 h-3 w-1/2 rounded bg-piedra/40" />
              <div className="mt-4 flex items-center justify-between border-t border-arena pt-4">
                <div className="h-7 w-20 rounded bg-primary/50" />
                <div className="h-11 w-32 rounded-2xl bg-primary/50" />
              </div>
            </div>
          ))}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-crema/80 px-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-tinta text-miel">
            <Lock className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-display text-xl font-extrabold tracking-[-0.02em] text-tinta">
            Las tareas se abren al verificarte
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-piedra">
            Aquí van a aparecer las tareas de tu zona. Te llega una notificación en cuanto un
            administrador apruebe tu perfil.
          </p>
          <Link to="/dashboard/trabajador/perfil"
            className="mt-5 inline-flex min-h-[46px] items-center rounded-2xl bg-tinta px-6 text-[15px] font-semibold text-crema transition hover:bg-stone-700">
            Completar mi perfil
          </Link>
        </div>
      </div>
    );

  if (tareas.length === 0)
    return (
      <div className="rounded-[20px] border border-arena bg-white py-16 text-center">
        <Briefcase className="mx-auto mb-3 h-12 w-12 text-stone-300" />
        <p className="font-medium text-piedra">No hay tareas disponibles</p>
        <p className="mt-1 text-sm text-piedra">Vuelve más tarde para ver nuevas oportunidades</p>
      </div>
    );

  return (
    <div className="space-y-3.5">
      {tareas.map((t) => (
        <TareaCard key={t.id} t={t} yaPostulado={postuladas.has(t.id)} onPostular={onPostular} />
      ))}
      {hayMas && (
        <button onClick={() => setPage((p) => p + 1)} disabled={loading}
          className="w-full rounded-[20px] border border-arena bg-white py-3.5 text-sm font-semibold text-piedra transition hover:border-stone-400 hover:text-tinta">
          {loading ? "Cargando..." : "Ver más tareas"}
        </button>
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
    api.get("/postulaciones/mis-postulaciones")
      .then((r) => setPostulaciones(r.data.data || []))
      .catch(() => setErrorCarga("No se pudieron cargar tus postulaciones."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonLista />;
  if (errorCarga) return <ErrorCarga mensaje={errorCarga} />;

  if (postulaciones.length === 0)
    return (
      <div className="rounded-[20px] border border-arena bg-white py-16 text-center">
        <ClipboardList className="mx-auto mb-3 h-12 w-12 text-stone-300" />
        <p className="font-medium text-piedra">No tienes postulaciones aún</p>
        <p className="mt-1 text-sm text-piedra">Postúlate a tareas disponibles para verlas aquí</p>
      </div>
    );

  return (
    <div className="overflow-hidden rounded-[20px] border border-arena bg-white">
      <div className="divide-y divide-arena">
        {postulaciones.map((p) => (
          <div key={p.id} className="px-5 py-4 transition hover:bg-crema sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-tinta">{p.titulo}</p>
                <p className="mt-0.5 text-xs text-piedra">
                  {p.categoria} · {hace(p.created_at)}
                </p>
                {p.precio_propuesto && p.estado !== "rechazada" && (
                  <p className="mt-1 text-sm font-medium text-primary">
                    Tu oferta: {pesos(p.precio_propuesto)}
                  </p>
                )}
                {p.mensaje && p.estado !== "rechazada" && (
                  <p className="mt-1 line-clamp-1 text-sm text-piedra">&quot;{p.mensaje}&quot;</p>
                )}
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${estadoPostulacionStyle[p.estado] || "bg-stone-100 text-piedra"}`}>
                  {p.estado === "aceptada" ? "Aceptada" : p.estado === "rechazada" ? "Rechazada" : "Pendiente"}
                </span>
                {p.estado !== "rechazada" && (
                  <span className={`rounded-full px-2.5 py-1 text-xs ${estadoTareaStyle[p.tarea_estado] || "bg-stone-100 text-piedra"}`}>
                    {ESTADO_TAREA_LABEL[p.tarea_estado] || p.tarea_estado}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Mis trabajos ─────────────────────────────────
function TabTareasAceptadas({ tareas, loading, error }) {
  if (loading) return <SkeletonLista />;
  if (error) return <ErrorCarga mensaje={error} />;

  if (tareas.length === 0)
    return (
      <div className="rounded-[20px] border border-arena bg-white py-16 text-center">
        <CheckCircle className="mx-auto mb-3 h-12 w-12 text-stone-300" />
        <p className="font-medium text-piedra">No tienes tareas asignadas</p>
        <p className="mt-1 text-sm text-piedra">Cuando un cliente acepte tu postulación aparecerá aquí</p>
      </div>
    );

  return (
    <div className="overflow-hidden rounded-[20px] border border-arena bg-white">
      <div className="divide-y divide-arena">
        {tareas.map((t) => (
          <div key={t.id} className="px-5 py-4 transition hover:bg-crema sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-tinta">{t.titulo}</p>
                <p className="mt-0.5 line-clamp-1 text-sm text-piedra">{t.descripcion}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-piedra">
                  <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {t.categoria}</span>
                  {t.ubicacion && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {t.ubicacion}</span>
                  )}
                  <span className="flex items-center gap-1"><User className="h-3 w-3" /> {t.cliente_nombre}</span>
                </div>
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${estadoTareaStyle[t.estado] || "bg-stone-100 text-piedra"}`}>
                  {ESTADO_TAREA_LABEL[t.estado] || t.estado}
                </span>
                {t.precio_propuesto && (
                  <span className="text-sm font-semibold text-primary">{pesos(t.precio_propuesto)}</span>
                )}
                <Link to={`/chat/${t.id}`}
                  className="flex items-center gap-1.5 rounded-lg border border-arena px-3 py-1.5 text-xs font-medium text-piedra transition hover:bg-stone-100">
                  <MessageSquare className="h-3.5 w-3.5" /> Chat
                </Link>
                <Link to={`/tareas/${t.id}`}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-dark">
                  {t.estado === "en_progreso" ? <Camera className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {t.estado === "en_progreso" ? "Entregar trabajo" : "Ver detalle"}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Mis calificaciones ───────────────────────────
function TabCalificaciones() {
  const [calificaciones, setCalificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    api.get("/trabajadores/mis-calificaciones")
      .then((r) => setCalificaciones(r.data.data || []))
      .catch(() => setErrorCarga("No se pudieron cargar tus calificaciones."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonLista />;
  if (errorCarga) return <ErrorCarga mensaje={errorCarga} />;

  if (calificaciones.length === 0)
    return (
      <div className="rounded-[20px] border border-arena bg-white py-16 text-center">
        <Star className="mx-auto mb-3 h-12 w-12 text-stone-300" />
        <p className="font-medium text-piedra">Aún no tienes calificaciones</p>
        <p className="mt-1 text-sm text-piedra">Completa tareas para recibir reseñas de tus clientes</p>
      </div>
    );

  return (
    <div className="overflow-hidden rounded-[20px] border border-arena bg-white">
      <div className="divide-y divide-arena">
        {calificaciones.map((c, i) => (
          <div key={i} className="px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-tinta">{c.cliente_nombre}</p>
                <p className="mt-0.5 text-xs text-piedra">{c.tarea}</p>
              </div>
              <div aria-label={`${c.puntuacion} de 5`} className="flex flex-shrink-0 gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-4 w-4 ${n <= c.puntuacion ? "fill-miel text-miel-dark" : "text-stone-200"}`} />
                ))}
              </div>
            </div>
            {c.comentario && (
              <p className="mt-2 text-sm leading-relaxed text-piedra">&quot;{c.comentario}&quot;</p>
            )}
            <p className="mt-1.5 text-xs text-piedra">
              {new Date(c.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
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
  // El tab vive en la URL: al recargar o volver atrás se conserva,
  // y la barra superior puede enlazar directo a "Mis trabajos"
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab");
  const tabActivo = TABS.some((t) => t.id === tabParam) ? tabParam : "disponibles";
  const irATab = (id) => setParams({ tab: id });

  const [modalTarea, setModalTarea] = useState(null);
  const [postuladas, setPostuladas] = useState(new Set());
  const [stats, setStats] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const misTareas = useMisTareas();

  useEffect(() => {
    api.get("/postulaciones/mis-postulaciones")
      .then((r) => setPostuladas(new Set((r.data.data || []).map((p) => p.tarea_id ?? p.id))))
      .catch(() => {});
    api.get("/estadisticas").then((r) => setStats(r.data.data)).catch(() => {});
    Promise.all([api.get("/auth/me"), api.get("/categorias")])
      .then(([me, cats]) => {
        const yo = me.data.data;
        setPerfil(yo);
        const ids = yo?.categorias_ids || [];
        setCategorias((cats.data.data || []).filter((c) => ids.includes(c.id)).map((c) => c.nombre));
      })
      .catch(() => {});
  }, []);

  const handlePostulacionExitosa = useCallback((tarea_id) => {
    setPostuladas((prev) => new Set([...prev, tarea_id]));
    setModalTarea(null);
  }, []);

  const pendientes = stats?.postulaciones?.pendiente || 0;
  // Sin nada que mostrar, la columna lateral no debe robarle ancho a la lista
  const hayRail = perfil?.verificado || misTareas.datos.some((t) => EN_CURSO.includes(t.estado));

  return (
    <div className="flex-1 bg-crema px-4 py-7 lg:px-8">
      <div className="mx-auto max-w-6xl">

        <Portada nombre={user?.nombre} stats={stats} perfil={perfil} categorias={categorias} />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-arena bg-white p-1.5">
            {TABS.map((tab) => {
              const activo = tabActivo === tab.id;
              return (
                <button key={tab.id} type="button" onClick={() => irATab(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition ${
                    activo ? "bg-tinta font-semibold text-crema" : "text-piedra hover:text-tinta"
                  }`}>
                  {tab.label}
                  {tab.id === "postulaciones" && pendientes > 0 && (
                    <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                      activo ? "bg-crema/20 text-crema" : "bg-menta text-menta-dark"
                    }`}>
                      {pendientes}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/pagos"
              className="flex min-h-[44px] items-center gap-2 rounded-2xl border border-arena bg-white px-4 text-sm font-medium text-tinta transition hover:border-stone-400">
              <Receipt className="h-4 w-4" aria-hidden="true" /> Pagos recibidos
            </Link>
            <Link to="/dashboard/trabajador/perfil"
              className="flex min-h-[44px] items-center gap-2 rounded-2xl border border-arena bg-white px-4 text-sm font-medium text-tinta transition hover:border-stone-400">
              <User className="h-4 w-4" aria-hidden="true" /> Mi perfil
            </Link>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-5">
          <div className="min-w-0 flex-[999_1_540px]">
            {tabActivo === "disponibles" && (
              <TabDisponibles postuladas={postuladas} onPostular={(t) => setModalTarea(t)} />
            )}
            {tabActivo === "postulaciones" && <TabMisPostulaciones />}
            {tabActivo === "aceptadas" && (
              <TabTareasAceptadas tareas={misTareas.datos} loading={misTareas.loading} error={misTareas.error} />
            )}
            {tabActivo === "calificaciones" && <TabCalificaciones />}
          </div>

          {hayRail && (
            <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
              <RailTrabajos tareas={misTareas.datos} loading={misTareas.loading} onVerTodos={() => irATab("aceptadas")} />
              {perfil?.verificado && <RailReputacion stats={stats} />}
            </aside>
          )}
        </div>

      </div>

      {modalTarea && (
        <ModalPostularse tarea={modalTarea} onClose={() => setModalTarea(null)} onSuccess={handlePostulacionExitosa} />
      )}
    </div>
  );
}
