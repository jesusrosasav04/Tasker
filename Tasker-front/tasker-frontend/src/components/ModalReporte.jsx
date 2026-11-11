import { useState } from "react";
import { Link } from "react-router-dom";
import { X, Flag, AlertTriangle, CheckCircle } from "lucide-react";
import api from "../api/axios";
import { TIPOS_REPORTE, ESTADOS_DISPUTABLES } from "../api/reportes";

// Reportar un problema. Con `tarea` queda ligado a ella y permite abrir disputa; sin `tarea` es un reporte general.
export default function ModalReporte({ tarea = null, onClose, onCreado }) {
  const [tipo, setTipo] = useState(tarea ? "servicio" : "bug");
  const [motivo, setMotivo] = useState("");
  const [imagen, setImagen] = useState(null);
  const [disputa, setDisputa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [creado, setCreado] = useState(null); // { id, message }

  const puedeDisputar = tarea && ESTADOS_DISPUTABLES.includes(tarea.estado);

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (motivo.trim().length < 10) { setErrMsg("Describe el problema con al menos 10 caracteres."); return; }
    setLoading(true); setErrMsg("");
    const fd = new FormData();
    fd.append("tipo", tipo);
    fd.append("motivo", motivo.trim());
    if (tarea) fd.append("tarea_id", tarea.id);
    if (disputa) fd.append("disputa", "true");
    if (imagen) fd.append("imagen", imagen);
    try {
      const r = await api.post("/reportes", fd);
      setCreado({ id: r.data.data.id, message: r.data.message });
      onCreado?.(r.data.data.id, disputa);
    } catch (err) {
      setErrMsg(err.response?.data?.error || "No se pudo enviar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  const input = "mt-1 block w-full rounded-xl border border-arena bg-crema px-3 py-2.5 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/50 p-4" role="dialog" aria-modal="true" aria-labelledby="reporte-titulo">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-arena px-6 py-4">
          <h3 id="reporte-titulo" className="flex items-center gap-2 font-display text-lg font-bold text-tinta">
            <Flag className="h-5 w-5 text-primary" /> Reportar un problema
          </h3>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1.5 text-piedra hover:bg-crema">
            <X className="h-5 w-5" />
          </button>
        </div>

        {creado ? (
          <div className="p-6 text-center">
            <CheckCircle className="mx-auto mb-3 h-10 w-10 text-primary" />
            <p className="font-medium text-tinta">{creado.message}</p>
            <div className="mt-5 flex gap-3">
              <button onClick={onClose} className="flex-1 rounded-xl border border-arena py-2.5 text-sm font-medium text-tinta hover:bg-crema">
                Cerrar
              </button>
              <Link to={`/soporte/${creado.id}`} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
                Ver seguimiento
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleEnviar} className="space-y-4 p-6">
            {tarea && (
              <p className="text-sm text-piedra">
                Tarea: <span className="font-medium text-tinta">"{tarea.titulo}"</span>
              </p>
            )}
            <label className="block text-sm font-medium text-tinta">
              ¿De qué se trata?
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={input}>
                {Object.entries(TIPOS_REPORTE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-tinta">
              Cuéntanos qué pasó
              <textarea rows={4} value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={2000} required
                placeholder="Qué pasó, cuándo y qué esperabas que pasara"
                className={`${input} resize-none`} />
            </label>
            <label className="block text-sm font-medium text-tinta">
              Captura o foto <span className="font-normal text-piedra">(opcional, JPG/PNG/WEBP, máx. 5 MB)</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImagen(e.target.files[0] || null)}
                className={`${input} file:mr-3 file:rounded-lg file:border-0 file:bg-tinta file:px-3 file:py-1 file:text-sm file:text-crema`} />
            </label>

            {puedeDisputar && (
              <label className="flex gap-3 rounded-2xl border border-arena bg-crema p-4 text-sm">
                <input type="checkbox" checked={disputa} onChange={(e) => setDisputa(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary" />
                <span>
                  <span className="font-semibold text-tinta">Abrir una disputa</span>
                  <span className="mt-0.5 block text-piedra">
                    La tarea se pausa y soporte decide cómo queda (completada o cancelada). Avisaremos a la otra persona.
                  </span>
                </span>
              </label>
            )}

            {errMsg && (
              <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />{errMsg}
              </p>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-xl border border-arena py-2.5 text-sm font-medium text-tinta hover:bg-crema">
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
                {loading ? "Enviando..." : disputa ? "Abrir disputa" : "Enviar reporte"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
