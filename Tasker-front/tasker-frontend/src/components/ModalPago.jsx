import { useState, useEffect } from "react";
import { X, CreditCard, CheckCircle, AlertTriangle } from "lucide-react";
import api from "../api/axios";

// Registrar el pago de una tarea (cliente). El monto sugerido es el precio acordado en la postulación.
export default function ModalPago({ tarea, onClose, onPagado }) {
  const [metodos, setMetodos] = useState([]);
  const [metodoId, setMetodoId] = useState("");
  const [monto, setMonto] = useState(tarea.precio_acordado ?? tarea.presupuesto ?? "");
  const [referencia, setReferencia] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [exito, setExito] = useState(false);

  useEffect(() => {
    api.get("/pagos/metodos")
      .then((r) => {
        setMetodos(r.data.data || []);
        if (r.data.data?.[0]) setMetodoId(String(r.data.data[0].id));
      })
      .catch(() => setErrMsg("No se pudieron cargar los métodos de pago."));
  }, []);

  const handlePagar = async (e) => {
    e.preventDefault();
    if (!(Number(monto) > 0)) { setErrMsg("Ingresa un monto mayor a 0."); return; }
    setLoading(true); setErrMsg("");
    try {
      await api.post("/pagos", {
        tarea_id: tarea.id,
        metodo_pago_id: Number(metodoId),
        monto: Number(monto),
        referencia: referencia.trim() || undefined,
      });
      setExito(true);
      onPagado(tarea.id);
    } catch (err) {
      setErrMsg(err.response?.data?.error || "Error al registrar el pago.");
    } finally {
      setLoading(false);
    }
  };

  const input = "mt-1 block w-full rounded-xl border border-arena bg-crema px-3 py-2.5 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/50 p-4" role="dialog" aria-modal="true" aria-labelledby="pago-titulo">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-arena px-6 py-4">
          <h3 id="pago-titulo" className="flex items-center gap-2 font-display text-lg font-bold text-tinta">
            <CreditCard className="h-5 w-5 text-primary" /> Registrar pago
          </h3>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1.5 text-piedra hover:bg-crema">
            <X className="h-5 w-5" />
          </button>
        </div>

        {exito ? (
          <div className="p-6 text-center">
            <CheckCircle className="mx-auto mb-3 h-10 w-10 text-primary" />
            <p className="font-medium text-tinta">Pago registrado</p>
            <p className="mt-1 text-sm text-piedra">Le avisamos al especialista.</p>
            <button onClick={onClose}
              className="mt-5 w-full rounded-xl bg-tinta py-2.5 text-sm font-semibold text-crema hover:bg-stone-700">
              Listo
            </button>
          </div>
        ) : (
          <form onSubmit={handlePagar} className="space-y-4 p-6">
            <p className="text-sm text-piedra">
              Tarea: <span className="font-medium text-tinta">"{tarea.titulo}"</span>
            </p>
            <label className="block text-sm font-medium text-tinta">
              Método de pago
              <select value={metodoId} onChange={(e) => setMetodoId(e.target.value)} required className={input}>
                {metodos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-tinta">
              Monto (MXN)
              <input type="number" min="0.01" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} required className={input} />
            </label>
            <label className="block text-sm font-medium text-tinta">
              Referencia <span className="font-normal text-piedra">(opcional)</span>
              <input type="text" maxLength={255} value={referencia} onChange={(e) => setReferencia(e.target.value)}
                placeholder="Folio de transferencia, etc." className={input} />
            </label>
            {errMsg && (
              <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />{errMsg}
              </p>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-xl border border-arena py-2.5 text-sm font-medium text-tinta hover:bg-crema">
                Después
              </button>
              <button type="submit" disabled={loading || !metodoId}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
                {loading ? "Registrando..." : "Pagar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
