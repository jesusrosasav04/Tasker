import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, DollarSign, MapPin, X } from "lucide-react";
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

// ── Selector de mapa ──────────────────────────────────
function SelectorMapa({ onSeleccionar, onCerrar, initialLat, initialLng }) {
  const mapRef   = useRef(null);
  const instRef  = useRef(null);
  const markerRef = useRef(null);
  const leafletReady = useLeaflet();

  const LAT_DEFAULT = 19.4326;
  const LNG_DEFAULT = -99.1332;

  useEffect(() => {
    if (!leafletReady || !mapRef.current || instRef.current) return;

    const L   = window.L;
    const lat = initialLat || LAT_DEFAULT;
    const lng = initialLng || LNG_DEFAULT;

    const icono = L.divIcon({
      className: "",
      html: `<div style="width:28px;height:28px;background:#10b981;border-radius:50% 50% 50% 0;
               transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    const map = L.map(mapRef.current).setView([lat, lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Si hay posición inicial, poner marcador
    if (initialLat && initialLng) {
      markerRef.current = L.marker([lat, lng], { icon: icono }).addTo(map);
    }

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: icono }).addTo(map);
      }
    });

    // Intentar geolocalizar al usuario
    if (navigator.geolocation && !initialLat) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 15);
        },
        () => {}
      );
    }

    instRef.current = map;
    return () => { map.remove(); instRef.current = null; markerRef.current = null; };
  }, [leafletReady]);

  const handleConfirmar = () => {
    if (!markerRef.current) {
      alert("Haz clic en el mapa para seleccionar tu ubicación");
      return;
    }
    const { lat, lng } = markerRef.current.getLatLng();

    // Geocodificación inversa con Nominatim
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      .then((r) => r.json())
      .then((data) => {
        const direccion = data.display_name?.split(",").slice(0, 3).join(", ") || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        onSeleccionar({ lat, lng, direccion });
      })
      .catch(() => {
        onSeleccionar({ lat, lng, direccion: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900">Selecciona tu ubicación</h3>
            <p className="text-xs text-gray-400 mt-0.5">Haz clic en el mapa para marcar el punto exacto</p>
          </div>
          <button onClick={onCerrar} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!leafletReady ? (
          <div className="h-96 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "#10b981", borderTopColor: "transparent" }} />
          </div>
        ) : (
          <div ref={mapRef} style={{ height: "400px", zIndex: 0 }} />
        )}

        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            💡 También puedes escribir la dirección manualmente sin usar el mapa
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={onCerrar}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button onClick={handleConfirmar}
              style={{ backgroundColor: "#10b981" }}
              className="text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition">
              Confirmar ubicación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────
export default function NuevaTarea() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [exito, setExito]           = useState(false);
  const [errMsg, setErrMsg]         = useState("");
  const [mostrarMapa, setMostrarMapa] = useState(false);

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    categoria_id: "",
    presupuesto: "",
    ubicacion: "",
    latitud: null,
    longitud: null,
  });

  useEffect(() => {
    api.get("/categorias")
      .then((r) => setCategorias(r.data.data || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSeleccionarUbicacion = ({ lat, lng, direccion }) => {
    setForm({ ...form, ubicacion: direccion, latitud: lat, longitud: lng });
    setMostrarMapa(false);
  };

  const handleLimpiarUbicacion = () => {
    setForm({ ...form, ubicacion: "", latitud: null, longitud: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");
    if (form.titulo.trim().length < 5) {
      setErrMsg("El título debe tener al menos 5 caracteres");
      return;
    }
    setLoading(true);
    try {
      await api.post("/tareas", {
        titulo:       form.titulo.trim(),
        descripcion:  form.descripcion.trim(),
        categoria_id: form.categoria_id,
        ...(form.presupuesto && { presupuesto: parseFloat(form.presupuesto) }),
        ...(form.ubicacion   && { ubicacion: form.ubicacion.trim()  }),
        ...(form.latitud     && { latitud:  form.latitud  }),
        ...(form.longitud    && { longitud: form.longitud }),
      });
      setExito(true);
      setTimeout(() => navigate("/dashboard/cliente"), 2000);
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) setErrMsg("Demasiadas solicitudes, intenta más tarde.");
      else setErrMsg(err.response?.data?.error || "Error al crear la tarea");
    } finally {
      setLoading(false);
    }
  };

  if (exito) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">¡Tarea creada!</h2>
        <p className="text-gray-500 text-center max-w-sm">
          Tu tarea fue publicada. Los trabajadores podrán postularse en breve.
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#10b981", borderTopColor: "transparent" }} />
          Redirigiendo...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link to="/dashboard/cliente"
            className="p-2 rounded-lg hover:bg-gray-200 transition text-gray-500">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva tarea</h1>
            <p className="text-gray-500 text-sm mt-0.5">Publica lo que necesitas y recibe postulaciones</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Título */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Título <span className="text-red-400">*</span>
              </label>
              <input name="titulo" value={form.titulo} onChange={handleChange}
                placeholder="Ej: Reparación de tubería en cocina"
                required minLength={5}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              <p className="text-xs text-gray-400 mt-1">Mínimo 5 caracteres</p>
            </div>

            {/* Categoría */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Categoría <span className="text-red-400">*</span>
              </label>
              <select name="categoria_id" value={form.categoria_id} onChange={handleChange}
                required className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white">
                <option value="">Selecciona una categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Descripción <span className="text-red-400">*</span>
              </label>
              <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
                rows={4} required
                placeholder="Describe con detalle qué necesitas, incluyendo materiales, acceso, urgencia, etc."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none focus:ring-emerald-400" />
            </div>

            {/* Presupuesto y Ubicación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Presupuesto <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input name="presupuesto" type="number" min="0" step="0.01"
                    value={form.presupuesto} onChange={handleChange}
                    placeholder="0.00"
                    className="w-full pl-9 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Ubicación <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input name="ubicacion" value={form.ubicacion} onChange={handleChange}
                    placeholder="Dirección o colonia"
                    className="w-full pl-9 pr-10 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  {form.latitud && (
                    <button type="button" onClick={handleLimpiarUbicacion}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Botón seleccionar en mapa */}
            <button type="button" onClick={() => setMostrarMapa(true)}
              className="flex items-center gap-2 text-sm font-medium text-emerald-600 border border-emerald-200 bg-emerald-50 px-4 py-2.5 rounded-xl hover:bg-emerald-100 transition w-full justify-center">
              <MapPin className="h-4 w-4" />
              {form.latitud ? "📍 Ubicación en mapa seleccionada — cambiar" : "Seleccionar ubicación en el mapa"}
            </button>

            {/* Vista previa miniatura si hay coords */}
            {form.latitud && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <p className="text-sm text-emerald-700 truncate">{form.ubicacion}</p>
                <p className="text-xs text-emerald-500 ml-auto flex-shrink-0">
                  {parseFloat(form.latitud).toFixed(4)}, {parseFloat(form.longitud).toFixed(4)}
                </p>
              </div>
            )}

            {errMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {errMsg}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Link to="/dashboard/cliente"
                className="flex-1 text-center border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition text-sm">
                Cancelar
              </Link>
              <button type="submit" disabled={loading}
                style={{ backgroundColor: "#10b981" }}
                className="flex-1 text-white py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 text-sm">
                {loading ? "Publicando..." : "Publicar tarea"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal mapa */}
      {mostrarMapa && (
        <SelectorMapa
          onSeleccionar={handleSeleccionarUbicacion}
          onCerrar={() => setMostrarMapa(false)}
          initialLat={form.latitud}
          initialLng={form.longitud}
        />
      )}
    </div>
  );
}
