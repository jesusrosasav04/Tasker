import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, MapPin, DollarSign, Tag, User,
  Calendar, CheckCircle, Clock, MessageSquare,
  Star, ExternalLink, Flag, Camera, Hourglass,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import SkeletonLista from "../components/Skeleton";
import ModalReporte from "../components/ModalReporte";
import { urlProtegida } from "../api/archivos";

// ── Carga Leaflet desde CDN ───────────────────────────
function useLeaflet() {
  const [ready, setReady] = useState(!!window.L);

  useEffect(() => {
    if (window.L) { setReady(true); return; }

    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, []);

  return ready;
}

// ── Mapa de ubicación ─────────────────────────────────
function MapaUbicacion({ lat, lng, titulo }) {
  const mapRef = useRef(null);
  const instRef = useRef(null);
  const leafletReady = useLeaflet();

  useEffect(() => {
    if (!leafletReady || !mapRef.current || instRef.current) return;

    const L = window.L;

    // Ícono personalizado verde
    const icono = L.divIcon({
      className: "",
      html: `<div style="
        width:32px;height:32px;background:#0f766e;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);">
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const map = L.map(mapRef.current).setView([lat, lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    L.marker([lat, lng], { icon: icono })
      .addTo(map)
      .bindPopup(`<b>${titulo}</b>`)
      .openPopup();

    instRef.current = map;

    return () => {
      map.remove();
      instRef.current = null;
    };
  }, [leafletReady, lat, lng, titulo]);

  if (!leafletReady)
    return (
      <div className="h-48 rounded-xl bg-stone-100 flex items-center justify-center">
        <p className="text-sm text-stone-400">Cargando mapa...</p>
      </div>
    );

  return (
    <div className="space-y-2">
      <div ref={mapRef} style={{ height: "220px", borderRadius: "12px", zIndex: 0 }} />
      <a
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=16`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 text-xs text-primary hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Abrir en OpenStreetMap
      </a>
    </div>
  );
}

// ── Estado badge ──────────────────────────────────────
const estadoStyle = {
  pendiente:   { cls: "bg-stone-100 text-piedra",   label: "Pendiente" },
  en_progreso: { cls: "bg-amber-100 text-amber-700", label: "En progreso" },
  entregado:   { cls: "bg-sky-100 text-sky-800",     label: "Entregado · por aprobar" },
  completada:  { cls: "bg-menta text-primary", label: "Completada" },
  cancelada:   { cls: "bg-red-100 text-red-500",     label: "Cancelada" },
  disputa:     { cls: "bg-red-50 text-red-700",      label: "En disputa" },
};


// ── Evidencia de entrega (fotos protegidas por token) ─
function EvidenciaGaleria({ evidencias }) {
  const [urls, setUrls] = useState({});

  useEffect(() => {
    let vivo = true;
    const creadas = [];
    Promise.all(
      evidencias.map((e) =>
        urlProtegida(`/tareas/evidencias/${e.id}/archivo`)
          .then((u) => { creadas.push(u); return [e.id, u]; })
          .catch(() => [e.id, null])
      )
    ).then((pares) => { if (vivo) setUrls(Object.fromEntries(pares)); });
    return () => { vivo = false; creadas.forEach((u) => URL.revokeObjectURL(u)); };
  }, [evidencias]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {evidencias.map((e) => (
        <figure key={e.id} className="overflow-hidden rounded-xl border border-arena bg-crema">
          {urls[e.id] ? (
            <a href={urls[e.id]} target="_blank" rel="noreferrer" title="Ver en grande">
              <img src={urls[e.id]} alt="Evidencia del trabajo terminado" className="aspect-square w-full object-cover" />
            </a>
          ) : (
            <div className="flex aspect-square items-center justify-center text-xs text-stone-400">
              {urls[e.id] === null ? "No disponible" : "Cargando…"}
            </div>
          )}
          {e.nota && <figcaption className="px-3 py-2 text-xs text-piedra">{e.nota}</figcaption>}
        </figure>
      ))}
    </div>
  );
}

// ── Trabajador: entregar con foto ─────────────────────
function FormEntrega({ tareaId, onEntregado }) {
  const [foto, setFoto] = useState(null);
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [err, setErr] = useState("");

  const enviar = async (e) => {
    e.preventDefault();
    if (!foto) { setErr("Adjunta una foto del trabajo terminado."); return; }
    setErr("");
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append("foto", foto);
      if (nota.trim()) fd.append("nota", nota.trim());
      await api.post(`/tareas/${tareaId}/entregar`, fd);
      onEntregado();
    } catch (e2) {
      setErr(e2.response?.data?.error || "No se pudo entregar el trabajo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="space-y-3 rounded-xl border border-menta bg-teal-50/50 p-4">
      <p className="text-sm font-semibold text-tinta">Entregar trabajo</p>
      <p className="text-xs leading-relaxed text-piedra">
        Sube una foto del trabajo terminado. El cliente la revisa para aprobarlo, y es tu respaldo:
        si más adelante dice que no se hizo, la foto es lo que lo demuestra.
      </p>
      <label className="block">
        <span className="sr-only">Foto del trabajo terminado</span>
        <input type="file" accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFoto(e.target.files?.[0] || null)}
          className="block w-full text-xs text-piedra file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-medium file:text-white" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-piedra">Nota para el cliente (opcional)</span>
        <textarea rows={2} maxLength={500} value={nota} onChange={(e) => setNota(e.target.value)}
          className="w-full resize-none rounded-lg border border-arena px-3 py-2 text-sm focus:outline-none focus:ring-2" />
      </label>
      {err && <p className="text-xs text-red-600">{err}</p>}
      <button type="submit" disabled={enviando}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-50">
        <Camera className="h-4 w-4" />
        {enviando ? "Enviando…" : "Entregar con evidencia"}
      </button>
    </form>
  );
}

// ── Cliente: aprobar la entrega ───────────────────────
function BotonAprobar({ tareaId, onAprobado }) {
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [err, setErr] = useState("");

  const aprobar = async () => {
    setEnviando(true);
    setErr("");
    try {
      await api.patch(`/tareas/${tareaId}/completar`);
      onAprobado();
    } catch (e) {
      setErr(e.response?.data?.error || "No se pudo aprobar el trabajo.");
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-sky-200 bg-sky-50 p-4">
      <p className="text-sm font-semibold text-sky-900">El especialista entregó el trabajo</p>
      <p className="text-xs leading-relaxed text-sky-800">
        Compara la foto con lo que pediste. Al aprobar confirmas que el trabajo se hizo: se cierra la
        tarea y podrás calificar y registrar el pago. Si algo no quedó bien, no apruebes y usa
        "Reportar problema".
      </p>
      {!confirmar ? (
        <button onClick={() => setConfirmar(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark">
          <CheckCircle className="h-4 w-4" />
          Aprobar trabajo
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-tinta">
            ¿Confirmas que el trabajo quedó bien? Después de aprobar ya no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmar(false)} disabled={enviando}
              className="flex-1 rounded-xl border border-arena bg-white py-2 text-sm font-medium text-stone-700 hover:bg-crema">
              No
            </button>
            <button onClick={aprobar} disabled={enviando}
              className="flex-1 rounded-xl bg-primary py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50">
              {enviando ? "Aprobando…" : "Sí, aprobar"}
            </button>
          </div>
        </div>
      )}
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}

// ── Componente principal ──────────────────────────────
export default function DetalleTarea() {
  const { id }   = useParams();
  const { user } = useAuth();
  const [tarea, setTarea]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg]   = useState("");
  const [modalReporte, setModalReporte] = useState(false);

  useEffect(() => {
    api.get(`/tareas/${id}`)
      .then((r) => setTarea(r.data.data))
      .catch((err) => setErrMsg(err.response?.data?.error || "No se pudo cargar la tarea"))
      .finally(() => setLoading(false));
  }, [id]);

  const esCliente   = user?.role === "cliente";
  const esTrabajador = user?.role === "trabajador";
  const backLink = esCliente ? "/dashboard/cliente" : "/dashboard/trabajador";
  const recargar = () =>
    api.get(`/tareas/${id}`).then((r) => setTarea(r.data.data)).catch(() => {});

  if (loading) return (
    <div className="flex-1 bg-crema px-4 py-8">
      <SkeletonLista />
    </div>
  );

  if (errMsg) return (
    <div className="flex-1 bg-crema px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link to={backLink} className="flex items-center gap-2 text-sm text-piedra hover:text-stone-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
          {errMsg}
        </div>
      </div>
    </div>
  );

  const est = estadoStyle[tarea.estado] || estadoStyle.pendiente;
  const esAsignado = esTrabajador && tarea.trabajador?.id === user?.id;
  const fechaCorta = (d) =>
    new Date(d).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const tieneUbicacion = tarea.latitud && tarea.longitud;

  return (
    <div className="flex-1 bg-crema px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to={backLink}
            className="p-2 rounded-lg hover:bg-stone-200 transition text-piedra">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-2xl font-bold text-tinta truncate">{tarea.titulo}</h1>
              <span className={`text-xs font-medium px-3 py-1 rounded-full flex-shrink-0 ${est.cls}`}>
                {est.label}
              </span>
            </div>
            <p className="text-piedra text-sm mt-0.5">Tarea #{tarea.id}</p>
          </div>
          {/* Botón chat (si hay trabajador asignado) */}
          {tarea.trabajador && (
            <Link to={`/chat/${tarea.id}`}
              className="flex items-center gap-2 border border-arena text-stone-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-100 transition flex-shrink-0">
              <MessageSquare className="h-4 w-4" />
              Chat
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Columna principal ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Descripción */}
            <div className="bg-white rounded-2xl border border-arena p-6">
              <h2 className="font-display font-semibold text-tinta mb-3">Descripción</h2>
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                {tarea.descripcion}
              </p>
            </div>

            {/* Ubicación con mapa */}
            <div className="bg-white rounded-2xl border border-arena p-6">
              <h2 className="font-display font-semibold text-tinta mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-stone-400" />
                Ubicación
              </h2>
              {tarea.ubicacion && (
                <p className="text-sm text-piedra mb-3">{tarea.ubicacion}</p>
              )}
              {tieneUbicacion ? (
                <MapaUbicacion
                  lat={parseFloat(tarea.latitud)}
                  lng={parseFloat(tarea.longitud)}
                  titulo={tarea.titulo}
                />
              ) : (
                <p className="text-sm text-stone-400 italic">
                  {tarea.ubicacion || "Sin ubicación registrada"}
                </p>
              )}
            </div>

            {/* Trabajador asignado */}
            {tarea.trabajador && (
              <div className="bg-white rounded-2xl border border-arena p-6">
                <h2 className="font-display font-semibold text-tinta mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-stone-400" />
                  Trabajador asignado
                </h2>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-menta flex-shrink-0">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-tinta">{tarea.trabajador.nombre}</p>
                    <p className="text-sm text-piedra">{tarea.trabajador.email}</p>
                    {tarea.trabajador.calificacion_promedio > 0 && (
                      <p className="text-sm text-amber-600 mt-1">
                        ⭐ {Number(tarea.trabajador.calificacion_promedio).toFixed(1)}
                      </p>
                    )}
                    {tarea.trabajador.precio_propuesto && (
                      <p className="text-sm font-semibold text-primary mt-1">
                        Precio acordado: ${Number(tarea.trabajador.precio_propuesto).toLocaleString("es-MX")}
                      </p>
                    )}
                    {tarea.trabajador.mensaje && (
                      <p className="text-sm text-piedra mt-2 italic">
                        "{tarea.trabajador.mensaje}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Evidencia del trabajo */}
            {tarea.evidencias?.length > 0 && (
              <div className="bg-white rounded-2xl border border-arena p-6">
                <h2 className="font-display font-semibold text-tinta mb-1 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-stone-400" />
                  Evidencia del trabajo
                </h2>
                {tarea.entregado_at && (
                  <p className="mb-4 text-xs text-piedra">
                    Subida el {fechaCorta(tarea.entregado_at)}
                    {tarea.aprobado_at && ` · aprobada por ti el ${fechaCorta(tarea.aprobado_at)}`}
                  </p>
                )}
                <EvidenciaGaleria evidencias={tarea.evidencias} />
                {esCliente && (
                  <p className="mt-4 rounded-xl bg-crema px-4 py-3 text-xs leading-relaxed text-piedra">
                    <span className="font-semibold text-tinta">Por qué pedimos esta foto.</span>{" "}
                    El especialista la sube antes de que tú apruebes, así los dos quedan respaldados:
                    tú ves qué se hizo antes de pagar y él tiene cómo demostrarlo si después hay un
                    desacuerdo. Si algo no quedó bien, no apruebes: reporta el problema y el equipo de
                    Tasker revisa el caso con las fotos.
                  </p>
                )}
              </div>
            )}

            {/* Calificación */}
            {tarea.calificacion && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                <h2 className="font-display font-semibold text-tinta mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Calificación del trabajo
                </h2>
                <div className="flex items-center gap-2 mb-2">
                  {[1,2,3,4,5].map((n) => (
                    <Star key={n} className="h-5 w-5"
                      fill={n <= tarea.calificacion.puntuacion ? "#f59e0b" : "none"}
                      stroke={n <= tarea.calificacion.puntuacion ? "#f59e0b" : "#d1d5db"}
                      strokeWidth={1.5} />
                  ))}
                  <span className="text-sm font-semibold text-amber-700 ml-1">
                    {tarea.calificacion.puntuacion}/5
                  </span>
                </div>
                {tarea.calificacion.comentario && (
                  <p className="text-sm text-piedra italic">"{tarea.calificacion.comentario}"</p>
                )}
              </div>
            )}
          </div>

          {/* ── Columna lateral ── */}
          <div className="space-y-4">

            {/* Info general */}
            <div className="bg-white rounded-2xl border border-arena p-5">
              <h2 className="font-display text-xs font-semibold text-stone-400 uppercase tracking-wide mb-4">
                Detalles
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-stone-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-stone-400">Categoría</p>
                    <p className="text-sm font-medium text-tinta">{tarea.categoria}</p>
                  </div>
                </div>
                {tarea.presupuesto && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-stone-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-stone-400">Presupuesto</p>
                      <p className="text-sm font-semibold text-primary">
                        ${Number(tarea.presupuesto).toLocaleString("es-MX")}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-stone-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-stone-400">Publicada</p>
                    <p className="text-sm font-medium text-tinta">
                      {new Date(tarea.created_at).toLocaleDateString("es-MX", {
                        day: "numeric", month: "long", year: "numeric"
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-stone-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-stone-400">Cliente</p>
                    <p className="text-sm font-medium text-tinta">{tarea.cliente_nombre}</p>
                    {tarea.cliente_telefono && (
                      <p className="text-xs text-stone-400">{tarea.cliente_telefono}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones según rol */}
            <div className="bg-white rounded-2xl border border-arena p-5 space-y-3">
              <h2 className="font-display text-xs font-semibold text-stone-400 uppercase tracking-wide">
                Acciones
              </h2>

              {tarea.trabajador && (
                <Link to={`/chat/${tarea.id}`}
                  className="bg-primary hover:bg-primary-dark flex items-center justify-center gap-2 w-full text-white py-2.5 rounded-xl text-sm font-medium transition">
                  <MessageSquare className="h-4 w-4" />
                  Abrir chat
                </Link>
              )}

              {esAsignado && tarea.estado === "en_progreso" && (
                <FormEntrega tareaId={tarea.id} onEntregado={recargar} />
              )}

              {esAsignado && tarea.estado === "entregado" && (
                <p className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-sky-800">
                  <Hourglass className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  Entregaste el trabajo. Esperando la aprobación del cliente.
                </p>
              )}

              {esCliente && tarea.estado === "entregado" && (
                <BotonAprobar tareaId={tarea.id} onAprobado={recargar} />
              )}

              {esCliente && tarea.estado === "en_progreso" && (
                <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                  <Hourglass className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  Esperando que el especialista entregue el trabajo con fotos.
                </p>
              )}

              {esCliente && tarea.estado === "en_progreso" && (
                <Link to={`/dashboard/cliente/tareas/${tarea.id}`}
                  className="flex items-center justify-center gap-2 w-full border border-arena text-stone-700 py-2.5 rounded-xl text-sm font-medium hover:bg-crema transition">
                  Ver postulaciones
                </Link>
              )}

              {esCliente && tarea.estado === "completada" && !tarea.calificacion && (
                <Link to="/dashboard/cliente"
                  className="flex items-center justify-center gap-2 w-full bg-amber-50 border border-amber-200 text-amber-700 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-100 transition">
                  <Star className="h-4 w-4" />
                  Calificar trabajo
                </Link>
              )}

              {tarea.estado === "disputa" ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  Esta tarea está en disputa. Sigue el caso en{" "}
                  <Link to="/soporte" className="font-semibold underline">Soporte</Link>.
                </p>
              ) : (
                <button onClick={() => setModalReporte(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-arena py-2.5 text-sm font-medium text-piedra transition hover:bg-crema hover:text-tinta">
                  <Flag className="h-4 w-4" />
                  Reportar problema
                </button>
              )}
            </div>

            {/* Estado visual */}
            <div className="bg-white rounded-2xl border border-arena p-5">
              <h2 className="font-display text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
                Estado del trabajo
              </h2>
              <div className="space-y-2">
                {[
                  { key: "pendiente",   label: "Publicada",   icon: Clock },
                  { key: "en_progreso", label: "En progreso", icon: Clock },
                  { key: "entregado",   label: "Entregado con evidencia", icon: Camera },
                  { key: "completada",  label: "Aprobado por el cliente", icon: CheckCircle },
                ].map(({ key, label, icon: Icon }) => {
                  const estados = ["pendiente","en_progreso","entregado","completada"];
                  const actual  = estados.indexOf(tarea.estado);
                  const este    = estados.indexOf(key);
                  const activo  = actual >= este;
                  return (
                    <div key={key} className={`flex items-center gap-2 text-sm ${activo ? "text-primary" : "text-stone-300"}`}>
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className={activo ? "font-medium" : ""}>{label}</span>
                      {tarea.estado === key && (
                        <span className="ml-auto text-xs font-medium bg-menta text-primary px-2 py-0.5 rounded-full">
                          Actual
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalReporte && (
        <ModalReporte
          tarea={tarea}
          onClose={() => setModalReporte(false)}
          onCreado={(_, disputa) => disputa && setTarea((t) => ({ ...t, estado: "disputa" }))}
        />
      )}
    </div>
  );
}
