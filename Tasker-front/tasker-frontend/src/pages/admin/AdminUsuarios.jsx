import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Users, Briefcase, ShieldCheck, ToggleLeft, ToggleRight, Eye } from "lucide-react";
import api from "../../api/axios";
import AdminLayout from "./AdminLayout";

function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: "#10b981", borderTopColor: "transparent" }} />
    </div>
  );
}

const rolColor = {
  admin:      "bg-purple-100 text-purple-700",
  cliente:    "bg-blue-100 text-blue-700",
  trabajador: "bg-emerald-100 text-emerald-700",
};

// ── Tabla reutilizable por rol ────────────────────────
function TablaUsuarios({ titulo, icono: Icon, color, usuarios, toggling, onToggle, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`flex items-center gap-3 px-6 py-4 border-b border-gray-100`}>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">{titulo}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {loading ? "Cargando..." : `${usuarios.length} usuario${usuarios.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : usuarios.length === 0 ? (
        <div className="text-center py-10">
          <Icon className="h-8 w-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No hay usuarios en esta categoría</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {usuarios.map((u) => (
            <div key={u.id}
              className="flex items-center justify-between gap-3 px-6 py-3.5 hover:bg-gray-50 transition">
              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{u.nombre}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Registro: {new Date(u.created_at).toLocaleDateString("es-MX")}
                </p>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Link to={`/admin/usuarios/${u.id}`} title="Ver detalle"
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                  <Eye className="h-4 w-4" />
                </Link>
                <button onClick={() => onToggle(u)} disabled={toggling === u.id}
                  title={u.estado === 1 ? "Desactivar" : "Activar"}
                  className="flex items-center gap-1 text-xs font-medium transition disabled:opacity-50">
                  {u.estado === 1 ? (
                    <><ToggleRight className="h-6 w-6 text-emerald-500" /><span className="text-emerald-600">Activo</span></>
                  ) : (
                    <><ToggleLeft className="h-6 w-6 text-gray-400" /><span className="text-gray-400">Inactivo</span></>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────
export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState(null);
  const [errMsg, setErrMsg]     = useState("");

  const cargar = useCallback(() => {
    setLoading(true);
    // Traemos todos los usuarios (hasta 200 para no paginar aquí)
    api.get("/admin/usuarios?page=1&limit=200")
      .then((r) => setUsuarios(r.data.data?.usuarios || []))
      .catch(() => setErrMsg("Error al cargar usuarios."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleToggle = async (u) => {
    setToggling(u.id);
    setErrMsg("");
    try {
      await api.patch(`/admin/usuarios/${u.id}/estado`);
      setUsuarios((prev) =>
        prev.map((x) => x.id === u.id ? { ...x, estado: x.estado === 1 ? 0 : 1 } : x)
      );
    } catch (err) {
      setErrMsg(err.response?.data?.error || "Error al cambiar estado.");
    } finally {
      setToggling(null);
    }
  };

  const admins      = usuarios.filter((u) => u.role === "admin");
  const clientes    = usuarios.filter((u) => u.role === "cliente");
  const trabajadores = usuarios.filter((u) => u.role === "trabajador");

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {loading ? "Cargando..." : `${usuarios.length} usuario${usuarios.length !== 1 ? "s" : ""} registrados`}
          </p>
        </div>

        {errMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {errMsg}
          </div>
        )}

        {/* Fila 1 — Admins (ancho completo) */}
        <div className="mb-5">
          <TablaUsuarios
            titulo="Administradores"
            icono={ShieldCheck}
            color="bg-purple-100 text-purple-600"
            usuarios={admins}
            toggling={toggling}
            onToggle={handleToggle}
            loading={loading}
          />
        </div>

        {/* Fila 2 — Trabajadores y Clientes lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TablaUsuarios
            titulo="Trabajadores"
            icono={Briefcase}
            color="bg-emerald-100 text-emerald-600"
            usuarios={trabajadores}
            toggling={toggling}
            onToggle={handleToggle}
            loading={loading}
          />
          <TablaUsuarios
            titulo="Clientes"
            icono={Users}
            color="bg-blue-100 text-blue-600"
            usuarios={clientes}
            toggling={toggling}
            onToggle={handleToggle}
            loading={loading}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
