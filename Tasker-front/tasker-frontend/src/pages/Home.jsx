import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, ArrowRight, Bell, Star } from "lucide-react";
import api from "../api/axios";

// ── Paletas de avatar (fondo / texto con contraste AA) ─
const AVATARES = [
  "bg-miel text-miel-dark",
  "bg-menta text-menta-dark",
  "bg-orange-100 text-orange-900",
  "bg-sky-100 text-sky-900",
];

const iniciales = (nombre = "") =>
  nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "T";

// ── Hero: momentos reales del producto (ilustrativos) ─
function HeroCollage() {
  return (
    <div className="flex w-full max-w-[480px] flex-col gap-4" aria-hidden="true">
      <div className="flex items-center gap-3.5 self-start rounded-[20px] border border-arena bg-white px-5 py-4 shadow-[0_18px_36px_-24px_rgba(28,25,23,0.35)]">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-menta">
          <Bell className="h-5 w-5 text-primary" />
        </span>
        <p className="text-[15px] leading-snug">
          <strong>¡Tu postulación fue aceptada!</strong>
          <br />
          <span className="text-piedra">Te asignaron la tarea #4</span>
        </p>
      </div>

      <div className="w-[82%] self-end rounded-3xl bg-tinta p-6 text-crema">
        <p className="text-sm text-stone-400">Reparación de cajones de madera</p>
        <div className="mt-3.5 flex flex-col gap-2">
          <span className="self-start rounded-2xl rounded-bl-[4px] bg-stone-800 px-3.5 py-2.5 text-[15px]">
            Ya me dirijo hacia el domicilio
          </span>
          <span className="self-end rounded-2xl rounded-br-[4px] bg-primary px-3.5 py-2.5 text-[15px]">
            Okei, aquí lo espero
          </span>
        </div>
      </div>

      <div className="max-w-[300px] self-start rounded-[20px] bg-miel px-6 py-5">
        <p className="text-lg tracking-[2px] text-miel-dark">★★★★★</p>
        <p className="mt-2 font-display text-[22px] font-bold leading-tight">“Muy buen trabajo”</p>
        <p className="mt-1.5 text-sm text-miel-dark">Reseña de un cliente en Tasker</p>
      </div>
    </div>
  );
}

function TarjetaEspecialista({ t, index }) {
  const categoria = t.categorias?.split(",")[0]?.trim() || "Sin categoría";
  const calif = Number(t.calificacion_promedio) > 0 ? Number(t.calificacion_promedio).toFixed(1) : null;
  return (
    <article className="flex items-center gap-5 rounded-[28px] bg-crema p-7">
      <span className={`flex h-[88px] w-[88px] flex-shrink-0 items-center justify-center rounded-[28px] font-display text-[32px] font-extrabold ${AVATARES[index % AVATARES.length]}`}>
        {iniciales(t.nombre)}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-2xl font-bold">{t.nombre}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[15px] text-piedra">
          <span>{categoria}</span>
          {calif && (
            <span className="flex items-center gap-1">
              · <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {calif}
            </span>
          )}
          {t.verificado === 1 && <span>· Verificado</span>}
        </p>
        <Link to={`/trabajador/${t.trabajador_id}`}
          className="mt-3.5 inline-block rounded-full bg-tinta px-[18px] py-2.5 text-sm font-semibold text-crema transition hover:bg-stone-700">
          Ver perfil
        </Link>
      </div>
    </article>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [categorias, setCategorias] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    api.get("/categorias").then((r) => setCategorias(r.data.data || [])).catch(() => {});
    api.get("/trabajadores").then((r) => setTrabajadores(r.data.data || [])).catch(() => {});
  }, []);

  // Soporte para /#pasos desde la navbar
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

  // Especialistas por categoría (a partir del listado público)
  const conteo = useMemo(() => {
    const c = {};
    trabajadores.forEach((t) =>
      t.categorias?.split(",").forEach((n) => {
        const k = n.trim();
        if (k) c[k] = (c[k] || 0) + 1;
      })
    );
    return c;
  }, [trabajadores]);

  const destacados = useMemo(
    () =>
      [...trabajadores]
        .sort((a, b) => Number(b.calificacion_promedio) - Number(a.calificacion_promedio))
        .slice(0, 4),
    [trabajadores]
  );

  const buscar = (e) => {
    e.preventDefault();
    const q = busqueda.trim();
    navigate(q ? `/proveedores?nombre=${encodeURIComponent(q)}` : "/proveedores");
  };

  return (
    <main className="flex-1">
      {/* ── Hero ─────────────────────────────────────── */}
      <section>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-12 px-4 pb-24 pt-14 lg:px-6">
          <div className="min-w-0 flex-[1_1_560px]">
            <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-7xl lg:text-[84px]">
              Lo que tu casa necesita,{" "}
              <span className="rounded-xl bg-miel px-2.5">hecho</span> por Especialistas.
            </h1>
            <p className="mt-7 max-w-[520px] text-lg leading-relaxed text-piedra sm:text-[19px]">
              Plomeros, electricistas, carpinteros y más, revisados por nuestro equipo.
              Tú publicas, ellos proponen, tú decides.
            </p>

            <form onSubmit={buscar}
              className="mt-9 flex max-w-[600px] flex-wrap items-center gap-2 rounded-[28px] border-[1.5px] border-tinta bg-white p-2 pl-6 sm:rounded-full">
              <label className="flex min-h-[52px] flex-[1_1_240px] items-center gap-2.5">
                <Search className="h-5 w-5 flex-shrink-0 text-piedra" aria-hidden="true" />
                <span className="sr-only">Buscar especialista</span>
                <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Busca un especialista por nombre"
                  className="w-full bg-transparent text-[17px] text-tinta outline-none placeholder:text-stone-400" />
              </label>
              <button type="submit"
                className="min-h-[52px] flex-1 rounded-full bg-tinta px-6 text-base font-semibold text-crema transition hover:bg-stone-700 sm:flex-none">
                Buscar
              </button>
            </form>
            <Link to="/publicar"
              className="mt-5 inline-flex items-center gap-2 text-[15px] font-semibold text-primary hover:text-primary-dark">
              O publica tu tarea y recibe propuestas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex min-w-0 flex-[1_1_400px] justify-center">
            <HeroCollage />
          </div>
        </div>
      </section>

      {/* ── Categorías ───────────────────────────────── */}
      {categorias.length > 0 && (
        <section className="border-y border-arena bg-white">
          <div className="mx-auto max-w-7xl px-4 py-24 lg:px-6">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-4xl font-extrabold leading-none tracking-[-0.035em] sm:text-[52px]">
                Elige un oficio
              </h2>
              <p className="max-w-[360px] text-base text-piedra">
                Cada categoría muestra solo especialistas aprobados.
              </p>
            </div>
            <div className="grid gap-x-12 md:grid-cols-2">
              {categorias.map((cat, i) => (
                <Link key={cat.id} to={`/proveedores?categoria=${cat.id}`}
                  className="group flex items-center justify-between gap-4 border-t border-arena py-5 text-tinta">
                  <span className="flex items-baseline gap-5">
                    <span className="w-6 text-sm text-stone-500">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-display text-2xl font-bold tracking-tight transition group-hover:text-primary sm:text-[28px]">
                      {cat.nombre}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    {conteo[cat.nombre] > 0 && (
                      <span className="rounded-full bg-menta px-2.5 py-1 text-[13px] font-semibold text-menta-dark">
                        {conteo[cat.nombre]} {conteo[cat.nombre] === 1 ? "especialista" : "especialistas"}
                      </span>
                    )}
                    <ArrowRight className="h-[22px] w-[22px] transition group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Cómo funciona ────────────────────────────── */}
      <section id="pasos" className="scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 py-24 lg:px-6">
          <h2 className="mb-12 font-display text-4xl font-extrabold leading-none tracking-[-0.035em] sm:text-[52px]">
            De “se rompió” a “quedó”
            <br />
            en tres pasos.
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { n: 1, t: "Cuéntanos qué pasa", d: "Título, descripción, presupuesto y la ubicación en el mapa." },
              { n: 2, t: "Compara propuestas", d: "Cada especialista te manda su precio, un mensaje y su calificación." },
            ].map((p) => (
              <div key={p.n} className="flex min-h-[220px] flex-col justify-between rounded-[28px] border border-arena bg-white p-8">
                <span className="font-display text-6xl font-extrabold leading-none text-arena">{p.n}</span>
                <div>
                  <h3 className="mb-2 text-[22px] font-bold">{p.t}</h3>
                  <p className="leading-relaxed text-piedra">{p.d}</p>
                </div>
              </div>
            ))}
            <div className="flex min-h-[220px] flex-col justify-between rounded-[28px] bg-primary p-8 text-white">
              <span className="font-display text-6xl font-extrabold leading-none text-white/35">3</span>
              <div>
                <h3 className="mb-2 text-[22px] font-bold">Listo, y lo calificas</h3>
                <p className="leading-relaxed text-menta">Chatean, se hace el trabajo, pagas y dejas tu reseña.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Especialistas ────────────────────────────── */}
      {destacados.length > 0 && (
        <section className="border-t border-arena bg-white">
          <div className="mx-auto max-w-7xl px-4 py-24 lg:px-6">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-4xl font-extrabold leading-none tracking-[-0.035em] sm:text-[52px]">
                Gente de confianza
              </h2>
              <Link to="/proveedores" className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-dark">
                Ver a todos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {destacados.map((t, i) => (
                <TarjetaEspecialista key={t.trabajador_id} t={t} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
