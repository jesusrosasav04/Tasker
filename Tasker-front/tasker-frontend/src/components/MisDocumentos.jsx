import { useState, useEffect } from "react";
import { FileText, Upload, Trash2, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import api from "../api/axios";
import { abrirDocumento, TIPOS_DOCUMENTO } from "../api/archivos";

// Sección del trabajador: subir documentos para que un admin verifique su perfil
export default function MisDocumentos() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState("identificacion");
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [inputKey, setInputKey] = useState(0); // para limpiar el <input type="file">

  useEffect(() => {
    api.get("/documentos/mis-documentos")
      .then((r) => setDocs(r.data.data || []))
      .catch(() => setErrMsg("No se pudieron cargar tus documentos."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubir = async (e) => {
    e.preventDefault();
    if (!archivo) { setErrMsg("Selecciona un archivo."); return; }
    setSubiendo(true); setErrMsg(""); setOkMsg("");
    const fd = new FormData();
    fd.append("tipo", tipo);
    fd.append("archivo", archivo);
    try {
      const r = await api.post("/documentos", fd);
      setDocs((prev) => [r.data.data, ...prev]);
      setOkMsg(r.data.message);
      setArchivo(null);
      setInputKey((k) => k + 1);
    } catch (err) {
      setErrMsg(err.response?.data?.error || "Error al subir el documento.");
    } finally {
      setSubiendo(false);
    }
  };

  const handleEliminar = async (doc) => {
    if (!window.confirm(`¿Eliminar "${TIPOS_DOCUMENTO[doc.tipo] || doc.tipo}"? Esta acción no se puede deshacer.`)) return;
    setErrMsg("");
    try {
      await api.delete(`/documentos/${doc.id}`);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      setErrMsg(err.response?.data?.error || "Error al eliminar el documento.");
    }
  };

  const handleVer = (id) => abrirDocumento(id).catch((e) => setErrMsg(e.message));

  return (
    <section className="rounded-3xl border border-arena bg-white p-6">
      <h2 className="font-display text-xl font-bold text-tinta">Documentos de verificación</h2>
      <p className="mt-1 text-sm text-piedra">
        Sube tu identificación y certificados. Un administrador los revisará para verificar tu perfil.
      </p>

      <form onSubmit={handleSubir} className="mt-5 grid gap-3">
        <label className="text-sm font-medium text-tinta">
          Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-arena bg-crema px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {Object.entries(TIPOS_DOCUMENTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-tinta">
          Archivo (JPG, PNG, WEBP o PDF, máx. 5 MB)
          <input key={inputKey} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setArchivo(e.target.files[0] || null)}
            className="mt-1 block w-full rounded-xl border border-arena bg-crema px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-tinta file:px-3 file:py-1.5 file:text-sm file:text-crema" />
        </label>
        <button type="submit" disabled={subiendo}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50">
          <Upload className="h-4 w-4" />
          {subiendo ? "Subiendo..." : "Subir"}
        </button>
      </form>

      {errMsg && (
        <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4" />{errMsg}
        </p>
      )}
      {okMsg && <p className="mt-3 text-sm text-primary">{okMsg}</p>}

      <div className="mt-5">
        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-crema" />)}
          </div>
        ) : docs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-arena px-4 py-6 text-center text-sm text-piedra">
            Aún no has subido documentos.
          </p>
        ) : (
          <ul className="divide-y divide-arena rounded-2xl border border-arena">
            {docs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <FileText className="h-5 w-5 flex-shrink-0 text-piedra" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-tinta">{TIPOS_DOCUMENTO[d.tipo] || d.tipo}</p>
                  <p className="text-xs text-piedra">{new Date(d.created_at).toLocaleDateString("es-MX")}</p>
                </div>
                {d.verificado ? (
                  <span className="flex items-center gap-1 rounded-full bg-menta px-2.5 py-1 text-xs font-medium text-menta-dark">
                    <CheckCircle className="h-3.5 w-3.5" /> Verificado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-miel px-2.5 py-1 text-xs font-medium text-miel-dark">
                    <Clock className="h-3.5 w-3.5" /> En revisión
                  </span>
                )}
                <button type="button" onClick={() => handleVer(d.id)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-tinta hover:bg-crema">
                  Ver
                </button>
                {!d.verificado && (
                  <button type="button" onClick={() => handleEliminar(d)} aria-label="Eliminar documento"
                    className="rounded-lg p-1.5 text-piedra hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
