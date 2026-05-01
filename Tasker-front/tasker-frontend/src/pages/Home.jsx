import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Star } from "lucide-react";
import api from "../api/axios";

export default function Home() {
  const [categorias, setCategorias]     = useState([]);
  const [proveedores, setProveedores]   = useState([]);

  useEffect(() => {
    api.get("/categorias").then((r) => setCategorias(r.data.data || [])).catch(() => {});
    api.get("/trabajadores?limit=3").then((r) => setProveedores((r.data.data || []).slice(0, 3))).catch(() => {});
  }, []);

  return (
    <main className="flex-1">
      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg,#ffffff 0%,#f0fdf4 50%,#f0fdfa 100%)" }}
        className="px-4 py-24 text-center lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl font-extrabold leading-tight text-gray-900 lg:text-6xl">
            Conecta con los mejores <br />
            <span style={{ color: "#10b981" }}>proveedores locales</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-gray-500">
            Encuentra expertos confiables en plomería, electricidad, limpieza y más.
            Servicios de calidad cerca de ti, cuando los necesitas.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/proveedores"
              style={{ backgroundColor: "#10b981" }}
              className="flex items-center gap-2 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition text-sm">
              <Search className="h-4 w-4" />
              Buscar proveedores
            </Link>
            <Link to="/register"
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition text-sm">
              Publicar servicio
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-20 max-w-2xl border-t border-gray-200 pt-10">
          <div className="grid grid-cols-3 gap-8">
            {[
              { value: proveedores.length > 0 ? `${proveedores.length}+` : "—", label: "Proveedores" },
              { value: categorias.length > 0 ? `${categorias.length}` : "—",   label: "Categorías"  },
              { value: "4.8", label: "Calificación" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p style={{ color: "#10b981" }} className="text-4xl font-extrabold">{s.value}</p>
                <p className="mt-1 text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorías */}
      {categorias.length > 0 && (
        <section className="bg-white px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold text-gray-900">Servicios disponibles</h2>
              <p className="mt-2 text-gray-500">Encuentra el profesional que necesitas</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {categorias.map((cat) => (
                <Link key={cat.id} to={`/proveedores`}
                  className="flex flex-col items-center rounded-2xl border-2 border-transparent bg-white p-6 text-center transition-all hover:border-gray-200 hover:shadow-md">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: "#f0fdf4" }}>
                    <span className="text-2xl">🔧</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{cat.nombre}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Proveedores destacados */}
      {proveedores.length > 0 && (
        <section style={{ backgroundColor: "#f8fafc" }} className="px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Proveedores destacados</h2>
                <p className="mt-2 text-gray-500">Los mejores profesionales calificados</p>
              </div>
              <Link to="/proveedores"
                className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition mt-1">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {proveedores.map((p) => (
                <div key={p.trabajador_id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-lg">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar nombre={p.nombre} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{p.nombre}</h3>
                          {p.verificado === 1 && (
                            <span style={{ background: "#f0fdf4", color: "#15803d" }}
                              className="text-xs font-medium px-2 py-0.5 rounded-full">
                              Verificado
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500 truncate">
                          {p.categorias?.split(",")[0]?.trim() || "Sin categoría"}
                        </p>
                        <div className="mt-2 flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {p.calificacion_promedio > 0
                              ? Number(p.calificacion_promedio).toFixed(1)
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {p.descripcion && (
                      <p className="mt-3 text-sm text-gray-500 line-clamp-2">{p.descripcion}</p>
                    )}
                  </div>
                  <div className="border-t border-gray-100 px-6 py-4" style={{ backgroundColor: "#f9fafb" }}>
                    <Link to={`/trabajador/${p.trabajador_id}`}
                      style={{ backgroundColor: "#10b981" }}
                      className="block w-full text-center text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
                      Ver perfil
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
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
