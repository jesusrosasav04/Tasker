import { Link, useLocation } from "react-router-dom";

export default function Footer() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="bg-tinta text-stone-300">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-10 pt-16 sm:flex-row sm:items-end sm:justify-between lg:px-6">
        <div>
          <p className="font-display text-6xl font-extrabold leading-none tracking-tighter text-crema">
            tasker<span className="text-teal-300">.</span>
          </p>
          <p className="mt-3 text-[15px]">Servicios locales, gente verificada.</p>
        </div>
        <div className="flex flex-col gap-4 sm:items-end">
          <nav className="flex flex-wrap gap-6 text-[15px]">
            <Link to="/proveedores" className="hover:text-crema">Especialistas</Link>
            <Link to="/register" className="hover:text-crema">Ofrece tus servicios</Link>
            <Link to="/login" className="hover:text-crema">Iniciar sesión</Link>
          </nav>
          <p className="text-sm text-stone-400">© {new Date().getFullYear()} Tasker</p>
        </div>
      </div>
    </footer>
  );
}
