import { useState, useEffect } from "react";
import { Briefcase, CheckCircle, XCircle, Phone, Mail, Tag } from "lucide-react";
import api from "../../api/axios";
import AdminLayout from "./AdminLayout";

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

export default function AdminTrabajadores() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(null); // trabajador_id en proceso
  const [errMsg, setErrMsg] = useState("");

  const cargar = () => {
    setLoading(true);
    api
      .get("/admin/trabajadores/pendientes")
      .then((r) => setTrabajadores(r.data.data || []))
      .catch(() => setErrMsg("Error al cargar trabajadores pendientes."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleAccion = async (trabajador_id, accion) => {
    setErrMsg("");
    setProcesando(trabajador_id);
    try {
      await api.patch(`/admin/trabajadores/${trabajador_id}/verificar`, { accion });
      // Quitar de la lista tras la acción
      setTrabajadores((prev) =>
        prev.filter((t) => t.trabajador_id !== trabajador_id)
      );
    } catch (err) {
      setErrMsg(err.response?.data?.error || `Error al ${accion} trabajador.`);
    } finally {
      setProcesando(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Verificación de trabajadores
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {trabajadores.length} trabajador{trabajadores.length !== 1 ? "es" : ""}{" "}
            pendiente{trabajadores.length !== 1 ? "s" : ""} de revisión
          </p>
        </div>

        {errMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {errMsg}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? (
            <Spinner />
          ) : trabajadores.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                No hay trabajadores pendientes
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Todos los trabajadores han sido revisados
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {trabajadores.map((t) => {
                const enProceso = procesando === t.trabajador_id;
                return (
                  <div key={t.trabajador_id} className="px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      {/* Info trabajador */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 flex-shrink-0">
                            <Briefcase className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 leading-tight">
                              {t.nombre}
                            </p>
                            <p className="text-xs text-gray-400">
                              Registro:{" "}
                              {new Date(t.created_at).toLocaleDateString(
                                "es-MX",
                                { day: "numeric", month: "long", year: "numeric" }
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1.5 pl-11">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                            {t.email}
                          </div>
                          {t.telefono && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3.5 w-3.5 text-gray-400" />
                              {t.telefono}
                            </div>
                          )}
                          {t.categorias && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <Tag className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span>{t.categorias}</span>
                            </div>
                          )}
                          {t.descripcion && (
                            <p className="text-sm text-gray-500 italic mt-2 leading-relaxed">
                              "{t.descripcion}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Botones acción */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() =>
                            handleAccion(t.trabajador_id, "aprobar")
                          }
                          disabled={enProceso}
                          style={!enProceso ? { backgroundColor: "#10b981" } : {}}
                          className="flex items-center gap-1.5 text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:bg-gray-200"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {enProceso ? "..." : "Aprobar"}
                        </button>
                        <button
                          onClick={() =>
                            handleAccion(t.trabajador_id, "rechazar")
                          }
                          disabled={enProceso}
                          className="flex items-center gap-1.5 border border-red-200 text-red-500 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-50 transition disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          {enProceso ? "..." : "Rechazar"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
