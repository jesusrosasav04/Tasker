import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, DollarSign, MessageSquare, CheckCircle, Clock, ExternalLink } from "lucide-react";
import api from "../api/axios";
import SkeletonLista from "../components/Skeleton";

export default function PostulacionesTarea() {
  const { id } = useParams();
  const [postulaciones, setPostulaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aceptando, setAceptando] = useState(null); // id de la postulación que se está aceptando
  const [errMsg, setErrMsg] = useState("");
  const [tareaAceptada, setTareaAceptada] = useState(false);

  useEffect(() => {
    api
      .get(`/postulaciones/tarea/${id}`)
      .then((r) => {
        const data = r.data.data || [];
        setPostulaciones(data);
        // Si alguna ya está aceptada, marcar la tarea como aceptada
        if (data.some((p) => p.estado === "aceptada")) {
          setTareaAceptada(true);
        }
      })
      .catch(() => setPostulaciones([]))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAceptar = async (postulacion_id) => {
    setErrMsg("");
    setAceptando(postulacion_id);
    try {
      await api.patch(`/postulaciones/${postulacion_id}/aceptar`);
      // Actualizar estado local
      setPostulaciones((prev) =>
        prev.map((p) =>
          p.id === postulacion_id
            ? { ...p, estado: "aceptada" }
            : { ...p, estado: "rechazada" }
        )
      );
      setTareaAceptada(true);
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        setErrMsg("Demasiadas solicitudes, intenta más tarde.");
      } else {
        setErrMsg(err.response?.data?.error || "Error al aceptar la postulación");
      }
    } finally {
      setAceptando(null);
    }
  };

  const estadoPostulacion = {
    pendiente: { label: "Pendiente", class: "bg-stone-100 text-piedra" },
    aceptada: { label: "Aceptada ✓", class: "bg-menta text-primary" },
    rechazada: { label: "Rechazada", class: "bg-red-100 text-red-500" },
  };

  return (
    <div className="flex-1 bg-crema px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            to="/dashboard/cliente"
            className="p-2 rounded-lg hover:bg-stone-200 transition text-piedra"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-tinta">Postulaciones</h1>
            <p className="text-piedra text-sm mt-0.5">
              Tarea #{id} — Selecciona al trabajador ideal
            </p>
          </div>
        </div>

        {tareaAceptada && (
          <div className="mb-5 flex items-center gap-3 bg-menta border border-menta rounded-xl px-4 py-3">
            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-sm text-primary font-medium">
              Ya aceptaste a un trabajador para esta tarea. Las demás
              postulaciones fueron rechazadas automáticamente.
            </p>
          </div>
        )}

        {errMsg && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {errMsg}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-arena">
          <div className="px-6 py-4 border-b border-arena flex items-center justify-between">
            <h2 className="font-display font-semibold text-tinta">
              {loading ? "Cargando..." : `${postulaciones.length} postulación${postulaciones.length !== 1 ? "es" : ""}`}
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <SkeletonLista />
            </div>
          ) : postulaciones.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="h-12 w-12 text-stone-300 mx-auto mb-3" />
              <p className="text-piedra font-medium">
                Aún no hay postulaciones
              </p>
              <p className="text-stone-400 text-sm mt-1">
                Los trabajadores se irán postulando a medida que vean tu tarea
              </p>
            </div>
          ) : (
            <div className="divide-y divide-arena">
              {postulaciones.map((p) => {
                const estado = estadoPostulacion[p.estado] || estadoPostulacion.pendiente;
                return (
                  <div key={p.id} className="px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      {/* Info del trabajador */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-menta flex-shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-tinta">
                            {p.trabajador_nombre}
                          </p>
                          <p className="text-sm text-piedra">
                            {p.trabajador_email}
                          </p>
                          {p.calificacion_promedio > 0 && (
                            <p className="text-xs text-amber-600 mt-0.5">
                              ⭐ {Number(p.calificacion_promedio).toFixed(1)}
                            </p>
                          )}
                          {(p.trabajador_perfil_id || p.trabajador_id) && (
                            <Link
                              to={`/trabajador/${p.trabajador_perfil_id || p.trabajador_id}`}
                              className="text-primary inline-flex items-center gap-1 text-xs font-medium mt-1.5 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Ver perfil del especialista
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Estado badge */}
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full flex-shrink-0 ${estado.class}`}
                      >
                        {estado.label}
                      </span>
                    </div>

                    {/* Detalles */}
                    <div className="mt-3 ml-13 space-y-2 pl-[52px]">
                      {p.precio_propuesto && (
                        <div className="flex items-center gap-2 text-sm text-stone-700">
                          <DollarSign className="h-4 w-4 text-stone-400" />
                          <span className="font-medium">
                            ${Number(p.precio_propuesto).toLocaleString("es-MX")}
                          </span>
                          <span className="text-stone-400">precio propuesto</span>
                        </div>
                      )}
                      {p.mensaje && (
                        <div className="flex items-start gap-2 text-sm text-piedra">
                          <MessageSquare className="h-4 w-4 text-stone-400 mt-0.5 flex-shrink-0" />
                          <p className="leading-relaxed">{p.mensaje}</p>
                        </div>
                      )}
                      <p className="text-xs text-stone-400">
                        {new Date(p.created_at).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Botón aceptar */}
                    {p.estado === "pendiente" && !tareaAceptada && (
                      <div className="mt-4 pl-[52px]">
                        <button
                          onClick={() => handleAceptar(p.id)}
                          disabled={aceptando === p.id}
                          className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
                        >
                          {aceptando === p.id ? "Aceptando..." : "Aceptar trabajador"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
