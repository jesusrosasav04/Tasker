import { useState, useEffect } from "react";
import { Briefcase, CheckCircle, XCircle, Phone, Mail, Tag, FileText } from "lucide-react";
import api from "../../api/axios";
import SkeletonLista from "../../components/Skeleton";
import { abrirDocumento, TIPOS_DOCUMENTO } from "../../api/archivos";
import AdminLayout from "./AdminLayout";


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

  const handleVerificarDoc = async (trabajador_id, doc_id) => {
    setErrMsg("");
    try {
      await api.patch(`/documentos/${doc_id}/verificar`);
      setTrabajadores((prev) => prev.map((t) => t.trabajador_id !== trabajador_id ? t : {
        ...t,
        documentos: t.documentos.map((d) => d.id === doc_id ? { ...d, verificado: 1 } : d),
      }));
    } catch (err) {
      setErrMsg(err.response?.data?.error || "Error al verificar el documento.");
    }
  };

  const handleAccion = async (trabajador_id, accion) => {
    if (accion === "rechazar" && !window.confirm("¿Rechazar a este trabajador? Su cuenta quedará desactivada.")) return;
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
          <h1 className="font-display text-2xl font-bold text-tinta">
            Verificación de trabajadores
          </h1>
          <p className="text-piedra mt-1 text-sm">
            {trabajadores.length} trabajador{trabajadores.length !== 1 ? "es" : ""}{" "}
            pendiente{trabajadores.length !== 1 ? "s" : ""} de revisión
          </p>
        </div>

        {errMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {errMsg}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-arena overflow-hidden">
          {loading ? (
            <SkeletonLista />
          ) : trabajadores.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="h-12 w-12 text-stone-300 mx-auto mb-3" />
              <p className="text-piedra font-medium">
                No hay trabajadores pendientes
              </p>
              <p className="text-stone-400 text-sm mt-1">
                Todos los trabajadores han sido revisados
              </p>
            </div>
          ) : (
            <div className="divide-y divide-arena">
              {trabajadores.map((t) => {
                const enProceso = procesando === t.trabajador_id;
                return (
                  <div key={t.trabajador_id} className="px-6 py-5">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                      {/* Info trabajador */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-menta flex-shrink-0">
                            <Briefcase className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-tinta leading-tight">
                              {t.nombre}
                            </p>
                            <p className="text-xs text-stone-400">
                              Registro:{" "}
                              {new Date(t.created_at).toLocaleDateString(
                                "es-MX",
                                { day: "numeric", month: "long", year: "numeric" }
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1.5 pl-11">
                          <div className="flex items-center gap-2 text-sm text-piedra">
                            <Mail className="h-3.5 w-3.5 text-stone-400" />
                            {t.email}
                          </div>
                          {t.telefono && (
                            <div className="flex items-center gap-2 text-sm text-piedra">
                              <Phone className="h-3.5 w-3.5 text-stone-400" />
                              {t.telefono}
                            </div>
                          )}
                          {t.categorias && (
                            <div className="flex items-start gap-2 text-sm text-piedra">
                              <Tag className="h-3.5 w-3.5 text-stone-400 mt-0.5 flex-shrink-0" />
                              <span>{t.categorias}</span>
                            </div>
                          )}
                          {t.descripcion && (
                            <p className="text-sm text-piedra italic mt-2 leading-relaxed">
                              "{t.descripcion}"
                            </p>
                          )}

                          {/* Documentos subidos */}
                          <div className="mt-3">
                            {!t.documentos?.length ? (
                              <p className="text-xs text-piedra">Sin documentos subidos todavía.</p>
                            ) : (
                              <ul className="space-y-1.5">
                                {t.documentos.map((d) => (
                                  <li key={d.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-arena bg-crema px-3 py-2 text-sm">
                                    <FileText className="h-4 w-4 text-piedra" />
                                    <span className="flex-1 text-tinta">{TIPOS_DOCUMENTO[d.tipo] || d.tipo}</span>
                                    <button onClick={() => abrirDocumento(d.id).catch((e) => setErrMsg(e.message))}
                                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-tinta hover:bg-white">
                                      Ver
                                    </button>
                                    {d.verificado ? (
                                      <span className="rounded-full bg-menta px-2.5 py-0.5 text-xs font-medium text-menta-dark">Verificado</span>
                                    ) : (
                                      <button onClick={() => handleVerificarDoc(t.trabajador_id, d.id)}
                                        className="rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-dark">
                                        Verificar
                                      </button>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botones acción */}
                      <div className="flex gap-2 flex-shrink-0 sm:flex-col">
                        <button
                          onClick={() =>
                            handleAccion(t.trabajador_id, "aprobar")
                          }
                          disabled={enProceso}
                          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50"
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
