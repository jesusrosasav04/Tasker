import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, MapPin, Tag, ArrowLeft } from "lucide-react";
import api from "../api/axios";

function Estrellas({ puntuacion }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className="h-4 w-4"
          fill={n <= Math.round(puntuacion) ? "#f59e0b" : "none"}
          stroke={n <= Math.round(puntuacion) ? "#f59e0b" : "#d1d5db"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export default function PerfilTrabajador() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trabajador, setTrabajador] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [errMsg, setErrMsg]         = useState("");

  useEffect(() => {
    api.get(`/trabajadores/${id}`)
      .then((r) => setTrabajador(r.data.data))
      .catch(() => setErrMsg("No se encontró el perfil del trabajador"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "#10b981", borderTopColor: "transparent" }} />
      </div>
    );

  if (errMsg)
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{errMsg}</p>
        <button onClick={() => navigate("/proveedores")}
          className="mt-4 text-sm text-emerald-600 underline">
          Volver a especialistas
        </button>
      </div>
    );

  const initials = trabajador.nombre?.[0]?.toUpperCase() || "T";
  const promedio = Number(trabajador.calificacion_promedio) || 0;

  return (
    <div className="flex-1 bg-gray-50 px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-2xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{trabajador.nombre}</h1>
                {trabajador.verificado === 1 && (
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    Verificado ✓
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Estrellas puntuacion={promedio} />
                <span className="text-sm font-medium text-gray-700">
                  {promedio > 0 ? promedio.toFixed(1) : "Sin calificaciones"}
                </span>
                {trabajador.resenas?.length > 0 && (
                  <span className="text-sm text-gray-400">
                    ({trabajador.resenas.length} reseña{trabajador.resenas.length !== 1 ? "s" : ""})
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  🗓 Miembro desde {new Date(trabajador.created_at).getFullYear()}
                </span>
              </div>

              {trabajador.categorias && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {trabajador.categorias.split(",").map((c) => (
                    <span key={c} className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                      <Tag className="h-3 w-3" />
                      {c.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: "Calificación", value: promedio > 0 ? promedio.toFixed(1) : "—", color: "text-amber-600" },
            { label: "Reseñas",      value: trabajador.resenas?.length || 0,           color: "text-blue-600"  },
            { label: "Satisfacción", value: promedio > 0 ? `${Math.round((promedio / 5) * 100)}%` : "—", color: "text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Descripción */}
        {trabajador.descripcion && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
            <h2 className="font-semibold text-gray-900 mb-2">Sobre mí</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{trabajador.descripcion}</p>
          </div>
        )}

        {/* Reseñas */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Reseñas recientes
          </h2>
          {!trabajador.resenas?.length ? (
            <p className="text-sm text-gray-400 text-center py-6">Aún no tiene reseñas</p>
          ) : (
            <div className="space-y-4">
              {trabajador.resenas.map((r, i) => (
                <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.cliente_nombre}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(r.created_at).toLocaleDateString("es-MX", {
                          day: "numeric", month: "long", year: "numeric"
                        })}
                      </p>
                    </div>
                    <Estrellas puntuacion={r.puntuacion} />
                  </div>
                  {r.comentario && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      "{r.comentario}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
