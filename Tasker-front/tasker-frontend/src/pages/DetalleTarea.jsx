import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, MapPin, DollarSign, Tag, User,
  Calendar, CheckCircle, Clock, MessageSquare,
  Star, Phone, ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

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
        width:32px;height:32px;background:#10b981;border-radius:50% 50% 50% 0;
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
      <div className="h-48 rounded-xl bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-400">Cargando mapa...</p>
      </div>
    );

  return (
    <div className="space-y-2">
      <div ref={mapRef} style={{ height: "220px", borderRadius: "12px", zIndex: 0 }} />
      <a
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=16`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 text-xs text-emerald-600 hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Abrir en OpenStreetMap
      </a>
    </div>
  );
}

// ── Estado badge ──────────────────────────────────────
const estadoStyle = {
  pendiente:   { cls: "bg-gray-100 text-gray-600",   label: "Pendiente" },
  en_progreso: { cls: "bg-amber-100 text-amber-700", label: "En progreso" },
  completada:  { cls: "bg-green-100 text-green-700", label: "Completada" },
  cancelada:   { cls: "bg-red-100 text-red-500",     label: "Cancelada" },
};

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: "#10b981", borderTopColor: "transparent" }} />
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

  useEffect(() => {
    api.get(`/tareas/${id}`)
      .then((r) => setTarea(r.data.data))
      .catch((err) => setErrMsg(err.response?.data?.error || "No se pudo cargar la tarea"))
      .finally(() => setLoading(false));
  }, [id]);

  const esCliente   = user?.role === "cliente";
  const esTrabajador = user?.role === "trabajador";
  const backLink = esCliente ? "/dashboard/cliente" : "/dashboard/trabajador";

  if (loading) return (
    <div className="flex-1 bg-gray-50 px-4 py-8">
      <Spinner />
    </div>
  );

  if (errMsg) return (
    <div className="flex-1 bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link to={backLink} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
          {errMsg}
        </div>
      </div>
    </div>
  );

  const est = estadoStyle[tarea.estado] || estadoStyle.pendiente;
  const tieneUbicacion = tarea.latitud && tarea.longitud;

  return (
    <div className="flex-1 bg-gray-50 px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to={backLink}
            className="p-2 rounded-lg hover:bg-gray-200 transition text-gray-500">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{tarea.titulo}</h1>
              <span className={`text-xs font-medium px-3 py-1 rounded-full flex-shrink-0 ${est.cls}`}>
                {est.label}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">Tarea #{tarea.id}</p>
          </div>
          {/* Botón chat (si hay trabajador asignado) */}
          {tarea.trabajador && (
            <Link to={`/chat/${tarea.id}`}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition flex-shrink-0">
              <MessageSquare className="h-4 w-4" />
              Chat
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Columna principal ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Descripción */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Descripción</h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {tarea.descripcion}
              </p>
            </div>

            {/* Ubicación con mapa */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                Ubicación
              </h2>
              {tarea.ubicacion && (
                <p className="text-sm text-gray-600 mb-3">{tarea.ubicacion}</p>
              )}
              {tieneUbicacion ? (
                <MapaUbicacion
                  lat={parseFloat(tarea.latitud)}
                  lng={parseFloat(tarea.longitud)}
                  titulo={tarea.titulo}
                />
              ) : (
                <p className="text-sm text-gray-400 italic">
                  {tarea.ubicacion || "Sin ubicación registrada"}
                </p>
              )}
            </div>

            {/* Trabajador asignado */}
            {tarea.trabajador && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  Trabajador asignado
                </h2>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 flex-shrink-0">
                    <User className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{tarea.trabajador.nombre}</p>
                    <p className="text-sm text-gray-500">{tarea.trabajador.email}</p>
                    {tarea.trabajador.telefono && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Phone className="h-3.5 w-3.5" />
                        {tarea.trabajador.telefono}
                      </p>
                    )}
                    {tarea.trabajador.calificacion_promedio > 0 && (
                      <p className="text-sm text-amber-600 mt-1">
                        ⭐ {Number(tarea.trabajador.calificacion_promedio).toFixed(1)}
                      </p>
                    )}
                    {tarea.trabajador.precio_propuesto && (
                      <p className="text-sm font-semibold text-emerald-600 mt-1">
                        Precio acordado: ${Number(tarea.trabajador.precio_propuesto).toLocaleString("es-MX")}
                      </p>
                    )}
                    {tarea.trabajador.mensaje && (
                      <p className="text-sm text-gray-500 mt-2 italic">
                        "{tarea.trabajador.mensaje}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Calificación */}
            {tarea.calificacion && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
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
                  <p className="text-sm text-gray-600 italic">"{tarea.calificacion.comentario}"</p>
                )}
              </div>
            )}
          </div>

          {/* ── Columna lateral ── */}
          <div className="space-y-4">

            {/* Info general */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Detalles
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Categoría</p>
                    <p className="text-sm font-medium text-gray-900">{tarea.categoria}</p>
                  </div>
                </div>
                {tarea.presupuesto && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Presupuesto</p>
                      <p className="text-sm font-semibold text-emerald-600">
                        ${Number(tarea.presupuesto).toLocaleString("es-MX")}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Publicada</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(tarea.created_at).toLocaleDateString("es-MX", {
                        day: "numeric", month: "long", year: "numeric"
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Cliente</p>
                    <p className="text-sm font-medium text-gray-900">{tarea.cliente_nombre}</p>
                    {tarea.cliente_telefono && (
                      <p className="text-xs text-gray-400">{tarea.cliente_telefono}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones según rol */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Acciones
              </h2>

              {tarea.trabajador && (
                <Link to={`/chat/${tarea.id}`}
                  style={{ backgroundColor: "#10b981" }}
                  className="flex items-center justify-center gap-2 w-full text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition">
                  <MessageSquare className="h-4 w-4" />
                  Abrir chat
                </Link>
              )}

              {esCliente && tarea.estado === "en_progreso" && (
                <Link to={`/dashboard/cliente/tareas/${tarea.id}`}
                  className="flex items-center justify-center gap-2 w-full border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
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
            </div>

            {/* Estado visual */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Estado del trabajo
              </h2>
              <div className="space-y-2">
                {[
                  { key: "pendiente",   label: "Publicada",   icon: Clock },
                  { key: "en_progreso", label: "En progreso", icon: Clock },
                  { key: "completada",  label: "Completada",  icon: CheckCircle },
                ].map(({ key, label, icon: Icon }) => {
                  const estados = ["pendiente","en_progreso","completada"];
                  const actual  = estados.indexOf(tarea.estado);
                  const este    = estados.indexOf(key);
                  const activo  = actual >= este;
                  return (
                    <div key={key} className={`flex items-center gap-2 text-sm ${activo ? "text-emerald-600" : "text-gray-300"}`}>
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className={activo ? "font-medium" : ""}>{label}</span>
                      {tarea.estado === key && (
                        <span className="ml-auto text-xs font-medium bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
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
    </div>
  );
}
