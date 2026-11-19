import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Send, AlertTriangle, Scale, Image as ImageIcon } from "lucide-react";
import api from "../api/axios";
import { urlProtegida } from "../api/archivos";
import { TIPOS_REPORTE, ESTADOS_REPORTE } from "../api/reportes";
import SkeletonLista, { ErrorCarga } from "./Skeleton";

const fecha = (d) => new Date(d).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Panel del admin: cambiar estado y, si es disputa, decidir cómo queda la tarea
function AccionesAdmin({ reporte, onActualizado }) {
  const [estado, setEstado] = useState(reporte.estado === "pendiente" ? "revisado" : reporte.estado);
  const [resolucion, setResolucion] = useState(reporte.resolucion || "");
  const [tareaEstado, setTareaEstado] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  if (reporte.disputa && reporte.estado === "resuelto") {
    return <p className="text-sm text-piedra">Disputa cerrada. La tarea quedó <b className="text-tinta">{reporte.tarea_estado}</b>.</p>;
  }

  const resolviendo = estado === "resuelto";
  const handleGuardar = async (e) => {
    e.preventDefault();
    if (resolviendo && reporte.disputa && !tareaEstado) { setErrMsg("Elige cómo queda la tarea."); return; }
    if (resolviendo && !window.confirm(reporte.disputa
      ? `¿Cerrar la disputa dejando la tarea como "${tareaEstado}"? No se puede deshacer.`
      : "¿Marcar el reporte como resuelto?")) return;
    setLoading(true); setErrMsg("");
    try {
      await api.patch(`/admin/reportes/${reporte.id}`, {
        estado,
        resolucion: resolucion.trim() || undefined,
        tarea_estado: resolviendo && reporte.disputa ? tareaEstado : undefined,
      });
      onActualizado();
    } catch (err) {
      setErrMsg(err.response?.data?.error || "No se pudo actualizar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  const input = "mt-1 block w-full rounded-xl border border-arena bg-crema px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
  return (
    <form onSubmit={handleGuardar} className="space-y-3">
      <label className="block text-sm font-medium text-tinta">
        Estado
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className={input}>
          {Object.entries(ESTADOS_REPORTE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </label>
      {resolviendo && reporte.disputa === 1 && (
        <fieldset className="rounded-2xl border border-arena p-3">
          <legend className="px-1 text-sm font-medium text-tinta">¿Cómo queda la tarea?</legend>
          {[["completada", "Completada: el trabajo se considera hecho"], ["cancelada", "Cancelada: el trabajo no se realizó"]].map(([v, l]) => (
            <label key={v} className="mt-1 flex items-center gap-2 text-sm text-tinta">
              <input type="radio" name="tarea_estado" value={v} checked={tareaEstado === v}
                onChange={() => setTareaEstado(v)} className="accent-primary" />
              {l}
            </label>
          ))}
        </fieldset>
      )}
      <label className="block text-sm font-medium text-tinta">
        Resolución {resolviendo ? "(la verá el usuario)" : <span className="font-normal text-piedra">(opcional)</span>}
        <textarea rows={3} value={resolucion} onChange={(e) => setResolucion(e.target.value)} maxLength={2000}
          required={resolviendo} className={`${input} resize-none`} />
      </label>
      {errMsg && <p role="alert" className="text-sm text-red-600">{errMsg}</p>}
      <button type="submit" disabled={loading}
        className="w-full rounded-xl bg-tinta py-2.5 text-sm font-semibold text-crema hover:bg-stone-700 disabled:opacity-50">
        {loading ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}

export default function ReporteDetalle({ id, esAdmin = false }) {
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errCarga, setErrCarga] = useState("");
  const [imagenUrl, setImagenUrl] = useState(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const finRef = useRef(null);

  const cargar = useCallback(() =>
    api.get(`/reportes/${id}`)
      .then((r) => { setReporte(r.data.data); setErrCarga(""); })
      .catch((err) => setErrCarga(err.response?.status === 404 ? "Este reporte no existe o no tienes acceso." : "No se pudo cargar el reporte."))
      .finally(() => setLoading(false)), [id]);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 10000); // respuestas nuevas de soporte / del usuario
    return () => clearInterval(intervalo);
  }, [cargar]);

  const tieneImagen = reporte?.tiene_imagen;
  useEffect(() => {
    if (!tieneImagen) return;
    let url;
    urlProtegida(`/reportes/${id}/imagen`).then((u) => { url = u; setImagenUrl(u); }).catch(() => setImagenUrl(false));
    return () => url && URL.revokeObjectURL(url);
  }, [id, tieneImagen]);

  useEffect(() => { finRef.current?.scrollIntoView({ block: "nearest" }); }, [reporte?.mensajes?.length]);

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true); setErrMsg("");
    try {
      await api.post(`/reportes/${id}/mensajes`, { mensaje: texto.trim() });
      setTexto("");
      await cargar();
    } catch (err) {
      setErrMsg(err.response?.data?.error || "No se pudo enviar el mensaje.");
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <SkeletonLista filas={2} />;
  if (errCarga && !reporte) return <ErrorCarga mensaje={errCarga} />;

  const est = ESTADOS_REPORTE[reporte.estado];
  const cerrado = reporte.estado === "resuelto";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      {/* Hilo de soporte */}
      <section className="flex min-h-[28rem] flex-col overflow-hidden rounded-3xl border border-arena bg-white">
        <header className="border-b border-arena px-6 py-4">
          <h2 className="font-display text-lg font-bold text-tinta">Conversación con soporte</h2>
          <p className="text-xs text-piedra">Se actualiza cada 10 segundos</p>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto bg-crema/60 px-4 py-4">
          {/* El reporte original abre el hilo */}
          <div className="rounded-2xl border border-arena bg-white p-4 text-sm">
            <p className="text-xs font-medium text-piedra">{reporte.creador_nombre} · {fecha(reporte.created_at)}</p>
            <p className="mt-1 whitespace-pre-wrap text-tinta">{reporte.motivo}</p>
            {imagenUrl && (
              <a href={imagenUrl} target="_blank" rel="noreferrer" className="mt-3 block">
                <img src={imagenUrl} alt="Imagen adjunta al reporte" className="max-h-64 rounded-xl border border-arena object-contain" />
              </a>
            )}
            {tieneImagen && !imagenUrl && (
              <p className="mt-2 flex items-center gap-1 text-xs text-piedra">
                <ImageIcon className="h-3.5 w-3.5" /> {imagenUrl === false ? "No se pudo cargar la imagen adjunta." : "Cargando imagen…"}
              </p>
            )}
          </div>

          {reporte.mensajes.length === 0 && (
            <p className="py-6 text-center text-sm text-piedra">
              {esAdmin ? "Aún no hay respuestas. Escribe al usuario." : "Soporte te responderá por aquí."}
            </p>
          )}
          {reporte.mensajes.map((m) => {
            // Del lado del usuario, "mío" = lo que escribió él; del lado admin, "mío" = lo que escribió soporte
            const mio = esAdmin ? m.es_soporte : !m.es_soporte;
            return (
              <div key={m.id} className={`flex ${mio ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[85%] flex-col gap-1 ${mio ? "items-end" : "items-start"}`}>
                  <span className="px-1 text-xs text-piedra">
                    {m.es_soporte ? `Soporte · ${m.remitente_nombre}` : m.remitente_nombre}
                  </span>
                  <div className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                    mio ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm border border-arena bg-white text-tinta"
                  }`}>
                    {m.mensaje}
                  </div>
                  <span className="px-1 text-xs text-piedra">{fecha(m.created_at)}</span>
                </div>
              </div>
            );
          })}
          <div ref={finRef} />
        </div>

        <footer className="border-t border-arena px-4 py-3">
          {cerrado ? (
            <p className="text-center text-sm text-piedra">
              Reporte resuelto.{!esAdmin && " Si el problema sigue, crea un reporte nuevo."}
            </p>
          ) : (
            <form onSubmit={handleEnviar} className="flex items-center gap-3">
              <label htmlFor="msg-soporte" className="sr-only">Mensaje</label>
              <input id="msg-soporte" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={1000}
                placeholder={esAdmin ? "Responder al usuario…" : "Escribe a soporte…"}
                className="flex-1 rounded-xl border border-arena px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              <button type="submit" disabled={enviando || !texto.trim()} aria-label="Enviar"
                className="rounded-xl bg-primary p-2.5 text-white hover:bg-primary-dark disabled:opacity-40">
                <Send className="h-5 w-5" />
              </button>
            </form>
          )}
          {errMsg && <p role="alert" className="mt-2 flex items-center gap-1 text-xs text-red-600"><AlertTriangle className="h-3.5 w-3.5" />{errMsg}</p>}
        </footer>
      </section>

      {/* Resumen */}
      <aside className="space-y-4">
        <div className="rounded-3xl border border-arena bg-white p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${est.cls}`}>{est.label}</span>
            {reporte.disputa === 1 && (
              <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                <Scale className="h-3.5 w-3.5" /> Disputa
              </span>
            )}
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-xs text-piedra">Tipo</dt><dd className="text-tinta">{TIPOS_REPORTE[reporte.tipo]}</dd></div>
            {reporte.tarea_id && (
              <div>
                <dt className="text-xs text-piedra">Tarea</dt>
                <dd className="text-tinta">
                  {esAdmin ? reporte.tarea_titulo : <Link to={`/tareas/${reporte.tarea_id}`} className="underline hover:text-primary">{reporte.tarea_titulo}</Link>}
                  <span className="text-piedra"> · {reporte.tarea_estado}</span>
                </dd>
              </div>
            )}
            {esAdmin && (
              <div><dt className="text-xs text-piedra">Reportado por</dt>
                <dd className="text-tinta">{reporte.creador_nombre} <span className="text-piedra">({reporte.creador_rol}) · {reporte.creador_email}</span></dd></div>
            )}
            {reporte.resolucion && (
              <div><dt className="text-xs text-piedra">Resolución</dt><dd className="whitespace-pre-wrap text-tinta">{reporte.resolucion}</dd></div>
            )}
          </dl>
        </div>
        {esAdmin && (
          <div className="rounded-3xl border border-arena bg-white p-5">
            <h3 className="mb-3 font-display font-bold text-tinta">Gestionar</h3>
            <AccionesAdmin key={reporte.estado} reporte={reporte} onActualizado={cargar} />
          </div>
        )}
      </aside>
    </div>
  );
}
