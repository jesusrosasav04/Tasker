import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Star } from "lucide-react";
import api from "../api/axios";

function ProviderCard({ t, onClick }) {
  const initials =
    `${t.nombre?.[0] || ""}${t.apellidoP?.[0] || ""}`.toUpperCase();
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-pink-500",
  ];
  const color = colors[t.nombre?.charCodeAt(0) % colors.length];

  return (
    <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-lg">
      <div className="p-6">
        <div className="flex items-start gap-4">
          {t.FotoPerfilURL ? (
            <img
              src={t.FotoPerfilURL}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-200"
              alt={t.nombre}
            />
          ) : (
            <div
              className={`h-16 w-16 rounded-full ${color} flex items-center justify-center text-white text-lg font-semibold ring-2 ring-gray-200`}
            >
              {initials}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                {t.nombre} {t.apellidoP}
              </h3>
              {t.estadoVerificado === 1 && (
                <span className="bg-blue-50 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                  Verificado
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {t.categorias?.split(",")[0]}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium text-gray-900">
                  {t.calificacion || "—"}
                </span>
                <span className="text-sm text-gray-400">
                  ({t.total_resenas || 0})
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">
                  {t.categorias?.split(",")[0] || "Sin zona"}
                </span>
              </div>
            </div>
          </div>
        </div>
        {t.biografia && (
          <p className="mt-3 text-sm text-gray-500 line-clamp-2">
            {t.biografia}
          </p>
        )}
      </div>
      <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4">
        <div className="flex w-full gap-3">
          <button
            onClick={onClick}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
          >
            Ver perfil
          </button>
          <button
            onClick={onClick}
            className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Contactar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Proveedores() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/categorias").then((r) => setCategorias(r.data.data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (busqueda) params.nombre = busqueda;
    if (categoria) params.categoria = categoria;
    api
      .get("/trabajadores", { params })
      .then((r) => setTrabajadores(r.data.data || []))
      .finally(() => setLoading(false));
  }, [busqueda, categoria]);

  return (
    <div className="flex-1 px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Proveedores disponibles
          </h1>
          <p className="mt-2 text-gray-500">
            Encuentra el profesional ideal para tu servicio
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar proveedor..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary sm:w-44"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.CategoriaID} value={c.CategoriaID}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Resultados */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trabajadores.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
            <p className="text-lg font-medium text-gray-900">
              No se encontraron proveedores
            </p>
            <p className="mt-2 text-gray-500">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trabajadores.map((t) => (
                <ProviderCard
                  key={t.TrabajadorID}
                  t={t}
                  onClick={() => navigate(`/trabajador/${t.TrabajadorID}`)}
                />
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-gray-500">
              {trabajadores.length} proveedor
              {trabajadores.length !== 1 ? "es" : ""} encontrado
              {trabajadores.length !== 1 ? "s" : ""}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
