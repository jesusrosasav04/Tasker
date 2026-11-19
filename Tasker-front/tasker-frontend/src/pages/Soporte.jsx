import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Flag, LifeBuoy, Scale, MessageSquare } from "lucide-react";
import api from "../api/axios";
import { TIPOS_REPORTE, ESTADOS_REPORTE } from "../api/reportes";
import SkeletonLista, { ErrorCarga } from "../components/Skeleton";
import ModalReporte from "../components/ModalReporte";
import ReporteDetalle from "../components/ReporteDetalle";

// /soporte: lista de mis reportes · /soporte/:id: detalle con el hilo de soporte
export default function Soporte() {
  const { id } = useParams();
  return (
    <main className="flex-1 bg-crema px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">{id ? <Detalle id={id} /> : <Lista />}</div>
    </main>
  );
}

function Detalle({ id }) {
  return (
    <>
      <Link to="/soporte" className="mb-6 inline-flex items-center gap-2 text-sm text-piedra hover:text-tinta">
        <ArrowLeft className="h-4 w-4" /> Mis reportes
      </Link>
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight text-tinta">Reporte #{id}</h1>
      <ReporteDetalle id={id} />
    </>
  );
}

function Lista() {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [modal, setModal] = useState(false);

  useEffect(() => {
    api.get("/reportes/mis-reportes")
      .then((r) => setReportes(r.data.data || []))
      .catch(() => setErrMsg("No se pudieron cargar tus reportes."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-tinta">Soporte</h1>
          <p className="mt-1 text-sm text-piedra">Reporta un problema y sigue la conversación con nuestro equipo.</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          <Flag className="h-4 w-4" /> Reportar problema
        </button>
      </div>
      <p className="mb-6 text-sm text-piedra">
        ¿El problema es con una tarea? Repórtalo desde la tarea para ligarlo a ella y, si hace falta, abrir una disputa.
      </p>

      <div className="overflow-hidden rounded-3xl border border-arena bg-white">
        {loading ? (
          <SkeletonLista />
        ) : errMsg ? (
          <ErrorCarga mensaje={errMsg} />
        ) : reportes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <LifeBuoy className="mx-auto mb-3 h-12 w-12 text-arena" />
            <p className="font-medium text-tinta">No tienes reportes</p>
            <p className="mt-1 text-sm text-piedra">Si algo no funciona como esperabas, cuéntanos.</p>
          </div>
        ) : (
          <ul className="divide-y divide-arena">
            {reportes.map((r) => (
              <li key={r.id}>
                <Link to={`/soporte/${r.id}`} className="flex flex-wrap items-center gap-3 px-6 py-4 hover:bg-crema">
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="truncate font-medium text-tinta">
                      #{r.id} · {TIPOS_REPORTE[r.tipo]}{r.tarea_titulo && <span className="text-piedra"> · {r.tarea_titulo}</span>}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-piedra">{r.motivo}</p>
                  </div>
                  {r.mensajes_nuevos > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-white">
                      <MessageSquare className="h-3.5 w-3.5" /> {r.mensajes_nuevos} nuevo{r.mensajes_nuevos > 1 ? "s" : ""}
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

      {modal && <ModalReporte onClose={() => setModal(false)} onCreado={(nuevo) => navigate(`/soporte/${nuevo}`)} />}
    </>
  );
}
