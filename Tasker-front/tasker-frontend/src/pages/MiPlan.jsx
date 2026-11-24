import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Coins, Gift, Sparkles, CheckCircle, AlertCircle, CreditCard,
  ArrowDownCircle, ArrowUpCircle,
} from "lucide-react";
import api from "../api/axios";

const fecha = (d) =>
  new Date(d).toLocaleString("es-MX", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

function Resumen({ icon: Icon, label, valor, destacado }) {
  return (
    <div className={`rounded-3xl border p-6 ${destacado ? "border-primary bg-teal-50" : "border-arena bg-white"}`}>
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${destacado ? "bg-primary text-white" : "bg-crema text-tinta"}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm text-piedra">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold tracking-tight">{valor}</p>
    </div>
  );
}

export default function MiPlan() {
  const [params, setParams] = useSearchParams();
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [comprando, setComprando] = useState(null);
  const [aviso, setAviso] = useState(null); // { tipo: "ok" | "error", texto }

  const cargar = useCallback(async () => {
    try {
      const r = await api.get("/creditos");
      setEstado(r.data.data);
    } catch (e) {
      setAviso({ tipo: "error", texto: e.response?.data?.error || "No se pudo cargar tu plan." });
    } finally {
      setCargando(false);
    }
  }, []);

  // Al volver de Stripe: confirmar el pago y refrescar
  useEffect(() => {
    const sessionId = params.get("session_id");
    const cancelado = params.get("cancelado");
    (async () => {
      if (sessionId) {
        try {
          const r = await api.get("/creditos/confirmar", { params: { session_id: sessionId } });
          setAviso({ tipo: "ok", texto: r.data.message || "Pago confirmado." });
        } catch (e) {
          setAviso({ tipo: "error", texto: e.response?.data?.error || "No se pudo confirmar el pago." });
        }
        setParams({}, { replace: true });
      } else if (cancelado) {
        setAviso({ tipo: "error", texto: "Cancelaste el pago. No se hizo ningún cargo." });
        setParams({}, { replace: true });
      }
      await cargar();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const comprar = async (paquete) => {
    setAviso(null);
    setComprando(paquete.id);
    try {
      const r = await api.post("/creditos/comprar", { paquete_id: paquete.id });
      if (r.data.data?.url) {
        window.location.href = r.data.data.url; // Checkout de Stripe
        return;
      }
      setAviso({ tipo: "ok", texto: r.data.message || "Créditos agregados." });
      await cargar();
    } catch (e) {
      setAviso({ tipo: "error", texto: e.response?.data?.error || "No se pudo iniciar la compra." });
    } finally {
      setComprando(null);
    }
  };

  return (
    <main className="flex-1 bg-crema">
      <div className="mx-auto max-w-5xl px-4 py-10 lg:px-6">
        <Link to="/dashboard/trabajador"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-piedra hover:text-tinta">
          <ArrowLeft className="h-4 w-4" /> Volver a mi panel
        </Link>

        <h1 className="font-display text-4xl font-extrabold tracking-tight">Mi plan y créditos</h1>
        <p className="mt-2 text-piedra">
          Tus primeras {estado?.gratis_total ?? 3} postulaciones son gratis. Después, cada postulación usa 1 crédito.
        </p>

        {aviso && (
          <div className={`mt-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
            aviso.tipo === "ok" ? "border-teal-200 bg-teal-50 text-primary-dark" : "border-red-200 bg-red-50 text-red-700"}`}>
            {aviso.tipo === "ok"
              ? <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              : <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
            {aviso.texto}
          </div>
        )}

        {cargando ? (
          <p className="mt-10 text-piedra">Cargando tu plan…</p>
        ) : estado && (
          <>
            {/* Resumen */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Resumen icon={Coins} label="Créditos disponibles" valor={estado.creditos} destacado />
              <Resumen icon={Gift} label="Postulaciones gratis restantes"
                valor={`${estado.gratis_restantes} de ${estado.gratis_total}`} />
              <Resumen icon={Sparkles} label="Plan actual"
                valor={estado.plan === "premium" ? "Premium" : "Freemium"} />
            </div>

            {/* Paquetes */}
            <div className="mt-12 flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-2xl font-extrabold tracking-tight">Comprar créditos</h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-arena bg-white px-3 py-1.5 text-xs text-piedra">
                <CreditCard className="h-3.5 w-3.5" />
                {estado.stripe_activo
                  ? "Modo de prueba: tarjeta 4242 4242 4242 4242, cualquier fecha futura y CVC"
                  : "Modo simulado: los créditos se suman al instante, sin cobro"}
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {estado.paquetes.map((p, i) => {
                const popular = i === 1;
                return (
                  <div key={p.id}
                    className={`relative flex flex-col rounded-3xl border bg-white p-6 ${popular ? "border-primary shadow-[0_0_0_4px_rgba(15,118,110,0.10)]" : "border-arena"}`}>
                    {popular && (
                      <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                        Más popular
                      </span>
                    )}
                    <p className="font-semibold">{p.nombre}</p>
                    <p className="mt-3 font-display text-4xl font-extrabold tracking-tight">{p.creditos}
                      <span className="ml-1.5 text-base font-semibold text-piedra">créditos</span>
                    </p>
                    <p className="mt-1 text-sm text-piedra">
                      ${p.precio} MXN · ${(p.precio / p.creditos).toFixed(2)} por postulación
                    </p>
                    <button onClick={() => comprar(p)} disabled={comprando !== null}
                      className={`mt-6 min-h-[48px] rounded-2xl text-[15px] font-semibold transition disabled:opacity-50 ${
                        popular ? "bg-primary text-white hover:bg-primary-dark" : "bg-tinta text-crema hover:bg-stone-700"}`}>
                      {comprando === p.id ? "Procesando…" : "Comprar"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Historial */}
            <h2 className="mt-12 font-display text-2xl font-extrabold tracking-tight">Historial</h2>
            {estado.movimientos.length === 0 ? (
              <p className="mt-4 text-piedra">Aún no tienes movimientos de créditos.</p>
            ) : (
              <ul className="mt-4 divide-y divide-arena overflow-hidden rounded-3xl border border-arena bg-white">
                {estado.movimientos.map((m) => {
                  const suma = m.cantidad > 0;
                  return (
                    <li key={m.id} className="flex items-center gap-4 px-5 py-4">
                      {suma
                        ? <ArrowUpCircle className="h-5 w-5 flex-shrink-0 text-primary" />
                        : <ArrowDownCircle className="h-5 w-5 flex-shrink-0 text-stone-400" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{m.descripcion || m.tipo}</p>
                        <p className="text-xs text-piedra">{fecha(m.created_at)}</p>
                      </div>
                      <span className={`font-semibold ${suma ? "text-primary" : "text-stone-500"}`}>
                        {suma ? `+${m.cantidad}` : m.cantidad}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  );
}
