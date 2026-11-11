import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Receipt, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const moneda = (n) => Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

// Historial de pagos: el cliente ve lo que pagó, el trabajador lo que recibió
export default function MisPagos() {
  const { user } = useAuth();
  const esTrabajador = user?.role === "trabajador";
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    api.get("/pagos/mis-pagos")
      .then((r) => setPagos(r.data.data || []))
      .catch(() => setErrMsg("No se pudo cargar el historial de pagos."))
      .finally(() => setLoading(false));
  }, []);

  const total = pagos.filter((p) => p.estado === "completado").reduce((s, p) => s + Number(p.monto), 0);

  return (
    <main className="flex-1 bg-crema px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link to={esTrabajador ? "/dashboard/trabajador" : "/dashboard/cliente"}
          className="mb-6 inline-flex items-center gap-2 text-sm text-piedra hover:text-tinta">
          <ArrowLeft className="h-4 w-4" /> Volver a mi panel
        </Link>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-tinta">
              {esTrabajador ? "Pagos recibidos" : "Mis pagos"}
            </h1>
            <p className="mt-1 text-sm text-piedra">
              {esTrabajador ? "Lo que te han pagado tus clientes" : "Pagos que registraste por tus tareas"}
            </p>
          </div>
          {!loading && pagos.length > 0 && (
            <div className="rounded-2xl border border-arena bg-white px-5 py-3 text-right">
              <p className="text-xs text-piedra">{esTrabajador ? "Total recibido" : "Total pagado"}</p>
              <p className="font-display text-2xl font-bold text-tinta">{moneda(total)}</p>
            </div>
          )}
        </div>

        {errMsg && (
          <p role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" />{errMsg}
          </p>
        )}

        <div className="overflow-hidden rounded-3xl border border-arena bg-white">
          {loading ? (
            <div className="space-y-px">
              {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse bg-crema/70" />)}
            </div>
          ) : pagos.length === 0 && !errMsg ? (
            <div className="px-6 py-16 text-center">
              <Receipt className="mx-auto mb-3 h-12 w-12 text-arena" />
              <p className="font-medium text-tinta">Aún no hay pagos</p>
              <p className="mt-1 text-sm text-piedra">
                {esTrabajador
                  ? "Cuando un cliente registre un pago por tu trabajo, aparecerá aquí."
                  : "Al completar una tarea podrás registrar el pago al especialista."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-arena">
              {pagos.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-tinta">{p.tarea}</p>
                    <p className="mt-0.5 text-sm text-piedra">
                      {esTrabajador ? `De ${p.cliente_nombre}` : `A ${p.trabajador_nombre}`} · {p.metodo_pago} ·{" "}
                      {new Date(p.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {p.referencia && <p className="mt-0.5 text-xs text-piedra">Ref: {p.referencia}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-tinta">{moneda(p.monto)}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.estado === "completado" ? "bg-menta text-menta-dark" : "bg-miel text-miel-dark"
                    }`}>
                      {p.estado === "completado" ? "Completado" : p.estado}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
