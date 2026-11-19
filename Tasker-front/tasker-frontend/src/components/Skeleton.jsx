// Estado de error al cargar: visible y con opción de reintentar
export function ErrorCarga({ mensaje = "No se pudo cargar la información." }) {
  return (
    <div role="alert" className="m-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
      <p>{mensaje}</p>
      <button onClick={() => window.location.reload()} className="mt-3 font-semibold underline">
        Reintentar
      </button>
    </div>
  );
}

// Estado de carga: filas grises que imitan una lista mientras llegan los datos
export default function SkeletonLista({ filas = 3 }) {
  return (
    <div role="status" aria-label="Cargando" className="w-full space-y-3 p-6">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 rounded-2xl border border-arena bg-white p-4">
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-arena/70" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/5 rounded-full bg-arena/70" />
            <div className="h-3 w-3/5 rounded-full bg-arena/50" />
          </div>
        </div>
      ))}
    </div>
  );
}
