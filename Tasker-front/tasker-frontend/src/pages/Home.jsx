import { Link } from "react-router-dom";
import {
  Search,
  ArrowRight,
  Wrench,
  Zap,
  Sparkles,
  Paintbrush,
  Hammer,
  Car,
  Leaf,
  Shield,
} from "lucide-react";

const categorias = [
  {
    nombre: "Plomeria",
    desc: "Reparaciones y mantenimiento",
    Icon: Wrench,
    bg: "#eff6ff",
    color: "#3b82f6",
  },
  {
    nombre: "Electricidad",
    desc: "Instalaciones y reparaciones",
    Icon: Zap,
    bg: "#fffbeb",
    color: "#f59e0b",
  },
  {
    nombre: "Limpieza",
    desc: "Hogar y oficina",
    Icon: Sparkles,
    bg: "#f0fdfa",
    color: "#14b8a6",
  },
  {
    nombre: "Pintura",
    desc: "Interior y exterior",
    Icon: Paintbrush,
    bg: "#fdf2f8",
    color: "#ec4899",
  },
  {
    nombre: "Carpinteria",
    desc: "Muebles y estructuras",
    Icon: Hammer,
    bg: "#fff7ed",
    color: "#f97316",
  },
  {
    nombre: "Mecanica",
    desc: "Vehiculos y maquinaria",
    Icon: Car,
    bg: "#f8fafc",
    color: "#64748b",
  },
  {
    nombre: "Jardineria",
    desc: "Mantenimiento de areas verdes",
    Icon: Leaf,
    bg: "#f0fdf4",
    color: "#22c55e",
  },
  {
    nombre: "Seguridad",
    desc: "Camaras y alarmas",
    Icon: Shield,
    bg: "#fff1f2",
    color: "#ef4444",
  },
];

const proveedoresDestacados = [
  {
    id: 1,
    nombre: "Carlos Martinez",
    servicio: "Plomeria",
    rating: 4.9,
    reviews: 127,
    zona: "Centro",
    verificado: true,
  },
  {
    id: 2,
    nombre: "Ana Rodriguez",
    servicio: "Limpieza",
    rating: 4.8,
    reviews: 89,
    zona: "Norte",
    verificado: true,
  },
  {
    id: 3,
    nombre: "Miguel Torres",
    servicio: "Electricidad",
    rating: 4.9,
    reviews: 156,
    zona: "Sur",
    verificado: true,
  },
];

function Avatar({ nombre }) {
  const initials = nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const palettes = [
    { bg: "#d1fae5", color: "#065f46" },
    { bg: "#dbeafe", color: "#1e40af" },
    { bg: "#ede9fe", color: "#5b21b6" },
  ];
  const p = palettes[nombre.charCodeAt(0) % palettes.length];
  return (
    <div
      style={{ background: p.bg, color: p.color }}
      className="h-14 w-14 rounded-full flex items-center justify-center font-semibold text-base flex-shrink-0"
    >
      {initials}
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section
        style={{
          background:
            "linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #f0fdfa 100%)",
        }}
        className="px-4 py-24 text-center lg:px-8"
      >
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl font-extrabold leading-tight text-gray-900 lg:text-6xl">
            Conecta con los mejores <br />
            <span style={{ color: "#10b981" }}>proveedores locales</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-gray-500">
            Encuentra expertos confiables en plomeria, electricidad, limpieza y
            mas. Servicios de calidad cerca de ti, cuando los necesitas.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/proveedores"
              style={{ backgroundColor: "#10b981" }}
              className="flex items-center gap-2 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition text-sm"
            >
              <Search className="h-4 w-4" />
              Buscar proveedores
            </Link>
            <Link
              to="/publicar"
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition text-sm"
            >
              Solicitar servicio
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-20 max-w-2xl border-t border-gray-200 pt-10">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "2rem",
            }}
          >
            {[
              { value: "500+", label: "Proveedores" },
              { value: "10K+", label: "Servicios" },
              { value: "4.8", label: "Calificacion" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p
                  style={{ color: "#10b981" }}
                  className="text-4xl font-extrabold"
                >
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="bg-white px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Servicios disponibles
            </h2>
            <p className="mt-2 text-gray-500">
              Encuentra el profesional que necesitas
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1rem",
            }}
          >
            {categorias.map((cat, i) => {
              const { Icon } = cat;
              return (
                <Link
                  key={cat.nombre}
                  to="/proveedores"
                  style={i === 1 ? { borderColor: "#10b981" } : {}}
                  className={`flex flex-col items-center rounded-2xl border-2 bg-white p-6 text-center transition-all hover:shadow-md ${
                    i === 1
                      ? "border-emerald-200 shadow-sm"
                      : "border-transparent hover:border-gray-200"
                  }`}
                >
                  <div
                    style={{ background: cat.bg }}
                    className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  >
                    <Icon style={{ color: cat.color }} className="h-7 w-7" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {cat.nombre}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">{cat.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Proveedores destacados */}
      <section
        style={{ backgroundColor: "#f8fafc" }}
        className="px-4 py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Proveedores destacados
              </h2>
              <p className="mt-2 text-gray-500">
                Los mejores profesionales calificados por nuestra comunidad
              </p>
            </div>
            <Link
              to="/proveedores"
              className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition mt-1"
            >
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1.5rem",
            }}
          >
            {proveedoresDestacados.map((p) => (
              <div
                key={p.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-lg"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar nombre={p.nombre} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">
                          {p.nombre}
                        </h3>
                        {p.verificado && (
                          <span
                            style={{ background: "#f0fdf4", color: "#15803d" }}
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                          >
                            Verificado
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{p.servicio}</p>
                      <div className="mt-2 flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1">
                          <span className="text-amber-400">★</span>
                          <span className="font-medium text-gray-900">
                            {p.rating}
                          </span>
                          <span className="text-gray-400">({p.reviews})</span>
                        </span>
                        <span className="flex items-center gap-1 text-gray-400 text-xs">
                          📍 {p.zona}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="border-t border-gray-100 px-6 py-4"
                  style={{ backgroundColor: "#f9fafb" }}
                >
                  <div className="flex gap-3">
                    <Link
                      to={`/trabajador/${p.id}`}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition text-center"
                    >
                      Ver perfil
                    </Link>
                    <button
                      style={{ backgroundColor: "#10b981" }}
                      className="flex-1 text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
                    >
                      Contactar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
