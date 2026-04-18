import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

const StarRating = ({ score }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <svg
        key={i}
        className={`w-5 h-5 ${i <= Math.round(score) ? "text-yellow-400" : "text-gray-200"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export default function PerfilTrabajador() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trabajador, setTrabajador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/trabajadores/${id}`)
      .then((r) => setTrabajador(r.data.data))
      .catch(() => setError("No se encontró el perfil"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (error)
    return (
      <div className="text-center py-20 text-gray-400">
        <p>{error}</p>
        <button
          onClick={() => navigate("/proveedores")}
          className="mt-4 text-primary text-sm underline"
        >
          Volver
        </button>
      </div>
    );

  const initials =
    `${trabajador.nombre?.[0] || ""}${trabajador.apellidoP?.[0] || ""}`.toUpperCase();

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-primary mb-6 flex items-center gap-1"
      >
        ← Volver
      </button>

      {/* Header */}
      <div className="bg-blue-50 rounded-xl p-6 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {trabajador.FotoPerfilURL ? (
              <img
                src={trabajador.FotoPerfilURL}
                className="w-16 h-16 rounded-full object-cover"
                alt={trabajador.nombre}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                {initials}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {trabajador.nombre} {trabajador.apellidoP}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <span>📍 {trabajador.categorias?.split(",")[0]}</span>
                <span>•</span>
                <span>🔧 Proveedor</span>
                <span>•</span>
                <span>
                  📅 Miembro desde{" "}
                  {new Date(trabajador.FechaRegistro).getFullYear()}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <StarRating score={trabajador.calificacion || 0} />
                <span className="font-semibold">
                  {trabajador.calificacion || "—"}
                </span>
                <span className="text-sm text-gray-400">
                  ({trabajador.total_resenas} reseñas)
                </span>
              </div>
              {trabajador.categorias && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {trabajador.categorias.split(",").map((c) => (
                    <span
                      key={c}
                      className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full"
                    >
                      {c.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: "Trabajos", value: trabajador.total_trabajos || 0 },
          { label: "Calificación", value: trabajador.calificacion || "—" },
          {
            label: "Satisfacción",
            value: `${Math.round((trabajador.calificacion / 5) * 100) || 0}%`,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-200 p-4 text-center"
          >
            <p className="text-2xl font-bold text-primary">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bio */}
      {trabajador.biografia && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="font-semibold text-gray-800 mb-2">Sobre mí</h2>
          <p className="text-sm text-gray-600">{trabajador.biografia}</p>
        </div>
      )}

      {/* Reseñas */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Actividad reciente</h2>
        {trabajador.resenas?.length > 0 ? (
          <div className="space-y-4">
            {trabajador.resenas.map((r, i) => (
              <div
                key={i}
                className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {r.cliente_nombre}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {r.Comentario || "Sin comentario"}
                  </p>
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i <= r.Puntuacion ? "text-yellow-400" : "text-gray-200"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Sin reseñas aún</p>
        )}
      </div>
    </div>
  );
}
