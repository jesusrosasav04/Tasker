import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ClipboardList, CheckCircle, Wallet, Receipt, Briefcase,
  TrendingUp, Star, Coins, Table2, BarChart3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const MXN = (n) =>
  Number(n || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const mesCorto = (mes) =>
  new Date(`${mes}-01T00:00:00`).toLocaleDateString("es-MX", { month: "short" }).replace(".", "");

const ESTADO_TAREA = {
  pendiente: "Pendientes", en_progreso: "En progreso", entregado: "Por aprobar",
  completada: "Completadas", cancelada: "Canceladas", disputa: "En disputa",
};
const ESTADO_POST = { pendiente: "Pendientes", aceptada: "Aceptadas", rechazada: "Rechazadas" };

function Tile({ icon: Icon, label, valor, detalle }) {
  return (
    <div className="rounded-3xl border border-arena bg-white p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-crema text-tinta">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm text-piedra">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-tinta">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-piedra">{detalle}</p>}
    </div>
  );
}

// Gráfica de barras de una sola serie (6 meses). Sin leyenda: el título la nombra.
function GraficaMensual({ serie }) {
  const [activo, setActivo] = useState(null);
  const [verTabla, setVerTabla] = useState(false);
  const esDinero = serie.unidad === "MXN";
  const fmt = (v) => (esDinero ? MXN(v) : `${v} ${v === 1 ? "tarea" : "tareas"}`);
  const max = Math.max(...serie.datos.map((d) => d.valor), 0);
  const iMax = serie.datos.findIndex((d) => d.valor === max);

  return (
    <section className="rounded-3xl border border-arena bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-extrabold tracking-tight">{serie.titulo}</h2>
        <button onClick={() => setVerTabla((v) => !v)}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-arena px-3 text-xs font-medium text-piedra hover:border-stone-400 hover:text-tinta">
          {verTabla ? <BarChart3 className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
          {verTabla ? "Ver gráfica" : "Ver tabla"}
        </button>
      </div>
      <p className="mt-1 text-xs text-piedra">Últimos 6 meses</p>

      {max === 0 ? (
        <p className="mt-8 rounded-2xl bg-crema px-4 py-8 text-center text-sm text-piedra">
          Aún no hay datos en este periodo.
        </p>
      ) : verTabla ? (
        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="border-b border-arena text-left text-xs text-piedra">
              <th className="py-2 font-medium">Mes</th>
              <th className="py-2 text-right font-medium">{esDinero ? "Ingresos" : "Tareas"}</th>
            </tr>
          </thead>
          <tbody>
            {serie.datos.map((d) => (
              <tr key={d.mes} className="border-b border-arena/60">
                <td className="py-2 capitalize">{mesCorto(d.mes)} {d.mes.slice(0, 4)}</td>
                <td className="py-2 text-right font-medium text-tinta">{fmt(d.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="mt-6">
          <div className="flex h-48 items-end gap-[2px] border-b border-arena" role="list" aria-label={serie.titulo}>
            {serie.datos.map((d, i) => {
              const alto = max > 0 ? Math.max((d.valor / max) * 100, d.valor > 0 ? 3 : 0) : 0;
              return (
                // Columna completa = área de hover más grande que la barra
                <div key={d.mes} role="listitem" tabIndex={0}
                  aria-label={`${mesCorto(d.mes)}: ${fmt(d.valor)}`}
                  onMouseEnter={() => setActivo(i)} onMouseLeave={() => setActivo(null)}
                  onFocus={() => setActivo(i)} onBlur={() => setActivo(null)}
                  className="relative flex h-full flex-1 cursor-default items-end justify-center px-2 outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  {(activo === i || (activo === null && i === iMax)) && (
                    <span className="pointer-events-none absolute z-10 -translate-y-1 whitespace-nowrap rounded-lg bg-tinta px-2 py-1 text-xs font-medium text-crema"
                      style={{ bottom: `${alto}%` }}>
                      {fmt(d.valor)}
                    </span>
                  )}
                  <div className={`w-full max-w-[44px] rounded-t-[4px] transition-colors ${activo === i ? "bg-teal-700" : "bg-teal-600"}`}
                    style={{ height: `${alto}%` }} />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-[2px]">
            {serie.datos.map((d) => (
              <span key={d.mes} className="flex-1 text-center text-xs capitalize text-piedra">{mesCorto(d.mes)}</span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Desglose({ titulo, filas }) {
  const total = filas.reduce((a, f) => a + f.n, 0);
  return (
    <section className="rounded-3xl border border-arena bg-white p-6">
      <h2 className="font-display text-xl font-extrabold tracking-tight">{titulo}</h2>
      {total === 0 ? (
        <p className="mt-4 text-sm text-piedra">Sin datos todavía.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {filas.map((f) => (
            <li key={f.label}>
              <div className="flex justify-between text-sm">
                <span className="text-tinta">{f.label}</span>
                <span className="font-medium text-tinta">{f.n}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-crema">
                <div className="h-full rounded-full bg-teal-600" style={{ width: `${(f.n / total) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Estadisticas() {
  const { user } = useAuth();
  const [s, setS] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/estadisticas")
      .then((r) => setS(r.data.data))
      .catch((e) => setErr(e.response?.data?.error || "No se pudieron cargar tus estadísticas."));
  }, []);

  const panel = user?.role === "trabajador" ? "/dashboard/trabajador" : "/dashboard/cliente";

  return (
    <main className="flex-1 bg-crema">
      <div className="mx-auto max-w-5xl px-4 py-10 lg:px-6">
        <Link to={panel} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-piedra hover:text-tinta">
          <ArrowLeft className="h-4 w-4" /> Volver a mi panel
        </Link>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Mis estadísticas</h1>
        <p className="mt-2 text-piedra">
          {user?.role === "trabajador" ? "Cómo va tu trabajo en Tasker." : "Un resumen de los servicios que has contratado."}
        </p>

        {err && <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}
        {!s && !err && <p className="mt-10 text-piedra">Calculando…</p>}

        {s?.rol === "cliente" && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Tile icon={ClipboardList} label="Tareas publicadas" valor={s.tareas.total} />
              <Tile icon={CheckCircle} label="Completadas" valor={s.tareas.completada || 0} />
              <Tile icon={Wallet} label="Gasto total" valor={MXN(s.gasto_total)}
                detalle={`${s.pagos_registrados} ${s.pagos_registrados === 1 ? "pago registrado" : "pagos registrados"}`} />
              <Tile icon={Receipt} label="Promedio por servicio" valor={MXN(s.gasto_promedio)} />
            </div>
            <div className="mt-6"><GraficaMensual serie={s.serie} /></div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Desglose titulo="Categorías que más contratas"
                filas={s.categorias_top.map((c) => ({ label: c.nombre, n: c.n }))} />
              <Desglose titulo="Tus tareas por estado"
                filas={Object.entries(ESTADO_TAREA)
                  .map(([k, label]) => ({ label, n: s.tareas[k] || 0 }))
                  .filter((f) => f.n > 0)} />
            </div>
          </>
        )}

        {s?.rol === "trabajador" && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Tile icon={Briefcase} label="Trabajos completados" valor={s.trabajos_completados} />
              <Tile icon={Wallet} label="Ingresos registrados" valor={MXN(s.ingresos_total)} />
              <Tile icon={TrendingUp} label="Tasa de éxito" valor={`${s.tasa_exito}%`}
                detalle={`${s.postulaciones.aceptada || 0} de ${s.postulaciones.total} postulaciones aceptadas`} />
              <Tile icon={Star} label="Calificación promedio"
                valor={s.calificacion_promedio ? `${s.calificacion_promedio} ★` : "—"}
                detalle={`${s.calificaciones} ${s.calificaciones === 1 ? "reseña" : "reseñas"}`} />
            </div>
            <div className="mt-6"><GraficaMensual serie={s.serie} /></div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Desglose titulo="Tus postulaciones"
                filas={Object.entries(ESTADO_POST).map(([k, label]) => ({ label, n: s.postulaciones[k] || 0 }))} />
              <section className="rounded-3xl border border-arena bg-white p-6">
                <h2 className="font-display text-xl font-extrabold tracking-tight">Tu plan</h2>
                <div className="mt-4 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-primary">
                    <Coins className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-display text-2xl font-extrabold">{s.creditos} créditos</p>
                    <p className="text-xs text-piedra">
                      Plan {s.plan === "premium" ? "Premium" : "Freemium"} · {s.gratis_restantes} postulaciones gratis restantes
                    </p>
                  </div>
                </div>
                <Link to="/mi-plan"
                  className="mt-5 inline-flex min-h-[44px] items-center rounded-2xl bg-tinta px-5 text-sm font-semibold text-crema hover:bg-stone-700">
                  Comprar créditos
                </Link>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
