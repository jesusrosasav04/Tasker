import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center bg-crema px-4 py-24">
      <div className="max-w-md text-center">
        <p className="font-display text-8xl font-extrabold tracking-tighter text-tinta">
          404<span className="text-primary">.</span>
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold text-tinta">Esta página no existe</h1>
        <p className="mt-2 text-piedra">Puede que el enlace esté mal escrito o que la página se haya movido.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="rounded-full bg-primary px-6 py-3 text-[15px] font-semibold text-white hover:bg-primary-dark">
            Ir al inicio
          </Link>
          <Link to="/proveedores" className="rounded-full border border-arena bg-white px-6 py-3 text-[15px] font-semibold text-tinta hover:border-stone-400">
            Ver especialistas
          </Link>
        </div>
      </div>
    </main>
  );
}
