import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  ClipboardList,
  Star,
  CheckCircle,
  Clock,
  XCircle,
  Tag,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
} from "lucide-react";
import api from "../../api/axios";
import AdminLayout from "./AdminLayout";

// ── Helpers ───────────────────────────────────────────
const estadoTareaStyle = {
  pendiente:   { cls: "bg-gray-100 text-gray-600",   label: "Pendiente" },
  en_progreso: { cls: "bg-amber-100 text-amber-700", label: "En progreso" },
  completada:  { cls: "bg-green-100 text-green-700", label: "Completada" },
  cancelada:   { cls: "bg-red-100 text-red-500",     label: "Cancelada" },
};

const estadoPostStyle = {
  pendiente: { cls: "bg-gray-100 text-gray-600",   label: "Pendiente" },
  aceptada:  { cls: "bg-green-100 text-green-700", label: "Aceptada ✓" },
  rechazada: { cls: "bg-red-100 text-red-500",     label: "Rechazada" },
};

const rolColor = {
  admin:      "bg-purple-100 text-purple-700",
  cliente:    "bg-blue-100 text-blue-700",
  trabajador: "bg-emerald-100 text-emerald-700",
};

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div
        className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: "#10b981", borderTopColor: "transparent" }}
      />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────
export default function AdminUsuarioDetalle() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [toggling, setToggling] = useState(false);

  const cargar = () => {
    setLoading(true);
    api
      .get(`/admin/usuarios/${id}`)
      .then((r) => setData(r.data.data))
      .catch(() => setErrMsg("No se pudo cargar el usuario."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [id]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await api.patch(`/admin/usuarios/${id}/estado`);
      setData((prev) => ({
        ...prev,
        usuario: {
          ...prev.usuario,
          estado: prev.usuario.estado === 1 ? 0 : 1,
        },
      }));
    } catch (err) {
      setErrMsg(err.response?.data?.error || "Error al cambiar estado.");
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <AdminLayout><Spinner /></AdminLayout>;

  if (errMsg)
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
            {errMsg}
          </div>
        </div>
      </AdminLayout>
    );

  const { usuario, perfil_trabajador, tareas_cliente, postulaciones, stats } = data;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            to="/admin/usuarios"
            className="p-2 rounded-lg hover:bg-gray-200 transition text-gray-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalle de usuario</h1>
            <p className="text-gray-500 text-sm mt-0.5">ID #{usuario.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Columna izquierda: perfil ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Tarjeta principal */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              {/* Avatar */}
              <div className="flex flex-col items-center text-center mb-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-3">
                  <User className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="font-bold text-gray-900 text-lg">{usuario.nombre}</h2>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full mt-1.5 ${rolColor[usuario.role] || "bg-gray-100 text-gray-600"}`}>
                  {usuario.role}
                </span>
              </div>

              {/* Info */}
              <div className="space-y-3">
                <InfoRow icon={Mail}     label="Correo"    value={usuario.email} />
                <InfoRow icon={Phone}    label="Teléfono"  value={usuario.telefono} />
                <InfoRow icon={Calendar} label="Registro"  value={new Date(usuario.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })} />
                {usuario.google_id && (
                  <InfoRow icon={ShieldCheck} label="Login con" value="Google OAuth" />
                )}
              </div>

              {/* Estado y toggle */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Estado</span>
                <button
                  onClick={handleToggle}
                  disabled={toggling}
                  className="flex items-center gap-1.5 text-sm font-medium transition disabled:opacity-50"
                >
                  {usuario.estado === 1 ? (
                    <>
                      <ToggleRight className="h-7 w-7 text-emerald-500" />
                      <span className="text-emerald-600">Activo</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-7 w-7 text-gray-400" />
                      <span className="text-gray-400">Inactivo</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Estadísticas
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ClipboardList className="h-4 w-4 text-gray-400" />
                    Tareas publicadas
                  </div>
                  <span className="text-sm font-bold text-gray-900">{stats.total_tareas}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-gray-400" />
                    Tareas completadas
                  </div>
                  <span className="text-sm font-bold text-gray-900">{stats.tareas_completadas}</span>
                </div>
                {perfil_trabajador && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Star className="h-4 w-4 text-gray-400" />
                        Calificación promedio
                      </div>
                      <span className="text-sm font-bold text-amber-600">
                        {perfil_trabajador.calificacion_promedio > 0
                          ? `⭐ ${Number(perfil_trabajador.calificacion_promedio).toFixed(1)}`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ShieldCheck className="h-4 w-4 text-gray-400" />
                        Verificado
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${perfil_trabajador.verificado ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {perfil_trabajador.verificado ? "Sí" : "Pendiente"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Perfil trabajador */}
            {perfil_trabajador && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Perfil trabajador
                </h3>
                {perfil_trabajador.categorias && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                    <Tag className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{perfil_trabajador.categorias}</span>
                  </div>
                )}
                {perfil_trabajador.descripcion && (
                  <p className="text-sm text-gray-500 italic leading-relaxed">
                    "{perfil_trabajador.descripcion}"
                  </p>
                )}
                {!perfil_trabajador.categorias && !perfil_trabajador.descripcion && (
                  <p className="text-sm text-gray-400">Sin información adicional</p>
                )}
              </div>
            )}
          </div>

          {/* ── Columna derecha: historial ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Tareas como cliente */}
            <div className="bg-white rounded-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-gray-400" />
                <h3 className="font-semibold text-gray-900">
                  Tareas publicadas
                </h3>
                <span className="ml-auto text-xs text-gray-400">
                  Últimas {tareas_cliente.length}
                </span>
              </div>

              {tareas_cliente.length === 0 ? (
                <div className="text-center py-10">
                  <ClipboardList className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No ha publicado tareas</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {tareas_cliente.map((t) => {
                    const est = estadoTareaStyle[t.estado] || { cls: "bg-gray-100 text-gray-600", label: t.estado };
                    return (
                      <div key={t.id} className="px-6 py-3.5 flex items-center justify-between gap-3 hover:bg-gray-50 transition">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{t.titulo}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {t.categoria} · {new Date(t.created_at).toLocaleDateString("es-MX")}
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${est.cls}`}>
                          {est.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Postulaciones (solo si es trabajador) */}
            {usuario.role === "trabajador" && (
              <div className="bg-white rounded-2xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">Postulaciones</h3>
                  <span className="ml-auto text-xs text-gray-400">
                    Últimas {postulaciones.length}
                  </span>
                </div>

                {postulaciones.length === 0 ? (
                  <div className="text-center py-10">
                    <Briefcase className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No tiene postulaciones</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {postulaciones.map((p) => {
                      const estPost = estadoPostStyle[p.postulacion_estado] || estadoPostStyle.pendiente;
                      const estTarea = estadoTareaStyle[p.tarea_estado] || { cls: "bg-gray-100 text-gray-500", label: p.tarea_estado };
                      return (
                        <div key={p.id} className="px-6 py-3.5 hover:bg-gray-50 transition">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{p.titulo}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${estTarea.cls}`}>
                                  Tarea: {estTarea.label}
                                </span>
                                {p.precio_propuesto && (
                                  <span className="text-xs text-emerald-600 font-medium">
                                    ${Number(p.precio_propuesto).toLocaleString("es-MX")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${estPost.cls}`}>
                              {estPost.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
