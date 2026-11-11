import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Flag, Scale, MessageSquare } from "lucide-react";
import api from "../../api/axios";
import { TIPOS_REPORTE, ESTADOS_REPORTE } from "../../api/reportes";
import SkeletonLista, { ErrorCarga } from "../../components/Skeleton";
import ReporteDetalle from "../../components/ReporteDetalle";
import AdminLayout from "./AdminLayout";

// /admin/reportes: bandeja con filtros · /admin/reportes/:id: detalle, hilo y resolución
export default function AdminReportes() {
  const { id } = useParams();
  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl">
        {id ? (
          <>
            <Link to="/admin/reportes" className="mb-6 inline-flex items-center gap-2 text-sm text-piedra hover:text-tinta">
              <ArrowLeft className="h-4 w-4" /> Todos los reportes
            </Link>
            <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight text-tinta">Reporte #{id}</h1>
            <ReporteDetalle id={id} esAdmin />
          </>
        ) : <Bandeja />}
      </div>
    </AdminLayout>
  );
}

function Bandeja() {
  const [filtros, setFiltros] = useState({ estado: "", tipo: "" });
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
    api.get("/admin/reportes", { params })
      .then((r) => { setReportes(r.data.data || []); setErrMsg(""); })
      .catch(() => setErrMsg("No se pudieron cargar los reportes."))
      .finally(() => setLoading(false));
  }, [filtros]);

  const cambiar = (k) => (e) => { setLoading(true); setFiltros((f) => ({ ...f, [k]: e.target.value })); };
  const select = "rounded-xl border border-arena bg-white px-3 py-2 text-sm text-tinta focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-tinta">Reportes</h1>
          <p className="mt-1 text-sm text-piedra">Incidencias y disputas de clientes y trabajadores</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="f-estado">Estado</label>
          <select id="f-estado" value={filtros.estado} onChange={cambiar("estado")} className={select}>
            <option value="">Todos los estados</option>
            {Object.entries(ESTADOS_REPORTE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <label className="sr-only" htmlFor="f-tipo">Tipo</label>
          <select id="f-tipo" value={filtros.tipo} onChange={cambiar("tipo")} className={select}>
            <option value="">Todos los tipos</option>
            {Object.entries(TIPOS_REPORTE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-arena bg-white">
        {loading ? (
          <SkeletonLista />
        ) : errMsg ? (
          <ErrorCarga mensaje={errMsg} />
        ) : reportes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Flag className="mx-auto mb-3 h-12 w-12 text-arena" />
            <p className="font-medium text-tinta">No hay reportes {filtros.estado || filtros.tipo ? "con estos filtros" : "todavía"}</p>
          </div>
        ) : (
          <ul className="divide-y divide-arena">
            {reportes.map((r) => (
              <li key={r.id}>
                <Link to={`/admin/reportes/${r.id}`} className="flex flex-wrap items-center gap-3 px-6 py-4 hover:bg-crema">
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="truncate font-medium text-tinta">
                      #{r.id} · {TIPOS_REPORTE[r.tipo]}{r.tarea_titulo && <span className="text-piedra"> · {r.tarea_titulo}</span>}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-piedra">
                      {r.creador_nombre} ({r.creador_rol}) — {r.motivo}
                    </p>
                  </div>
                  {r.mensajes_nuevos > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-white">
                      <MessageSquare className="h-3.5 w-3.5" /> {r.mensajes_nuevos}
                    </span>
                  )}
                  {r.disputa === 1 && (
                    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                      <Scale className="h-3.5 w-3.5" /> Disputa
                    </span>
                  )}
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADOS_REPORTE[r.estado].cls}`}>
                    {ESTADOS_REPORTE[r.estado].label}
                  </span>
                  <span className="text-xs text-piedra">{new Date(r.created_at).toLocaleDateString("es-MX")}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
