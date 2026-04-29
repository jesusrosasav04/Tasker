import { useState, useEffect, useCallback } from "react";
import { Users, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight } from "lucide-react";
import api from "../../api/axios";
import AdminLayout from "./AdminLayout";

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div
        className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: "#10b981", borderTopColor: "transparent" }}
      />
    </div>
  );
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null); // id del usuario que se está toggleando
  const [errMsg, setErrMsg] = useState("");
  const LIMIT = 20;

  const cargarUsuarios = useCallback(() => {
    setLoading(true);
    api
      .get(`/admin/usuarios?page=${page}&limit=${LIMIT}`)
      .then((r) => {
        setUsuarios(r.data.data?.usuarios || []);
        setTotal(r.data.data?.total || 0);
      })
      .catch(() => setErrMsg("Error al cargar usuarios."))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const handleToggle = async (usuario) => {
    setToggling(usuario.id);
    setErrMsg("");
    try {
      await api.patch(`/admin/usuarios/${usuario.id}/estado`);
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuario.id ? { ...u, estado: u.estado === 1 ? 0 : 1 } : u
        )
      );
    } catch (err) {
      setErrMsg(err.response?.data?.error || "Error al cambiar estado.");
    } finally {
      setToggling(null);
    }
  };

  const totalPaginas = Math.ceil(total / LIMIT);

  const rolBadge = {
    admin: "bg-purple-100 text-purple-700",
    cliente: "bg-blue-100 text-blue-700",
    trabajador: "bg-emerald-100 text-emerald-700",
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {total} usuario{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}
          </p>
        </div>

        {errMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {errMsg}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Cabecera tabla */}
          <div className="hidden sm:grid grid-cols-[1fr_1fr_120px_100px_80px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>Nombre</span>
            <span>Correo</span>
            <span>Rol</span>
            <span>Registro</span>
            <span className="text-right">Estado</span>
          </div>

          {loading ? (
            <Spinner />
          ) : usuarios.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {usuarios.map((u) => (
                <div
                  key={u.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_100px_80px] gap-2 sm:gap-4 px-6 py-4 items-center hover:bg-gray-50 transition"
                >
                  {/* Nombre */}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{u.nombre}</p>
                    <p className="text-xs text-gray-400 sm:hidden">{u.email}</p>
                  </div>

                  {/* Email (solo desktop) */}
                  <p className="hidden sm:block text-sm text-gray-500 truncate">
                    {u.email}
                  </p>

                  {/* Rol */}
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full w-fit ${rolBadge[u.role] || "bg-gray-100 text-gray-600"}`}
                  >
                    {u.role}
                  </span>

                  {/* Fecha */}
                  <p className="hidden sm:block text-xs text-gray-400">
                    {new Date(u.created_at).toLocaleDateString("es-MX")}
                  </p>

                  {/* Toggle estado */}
                  <div className="flex sm:justify-end">
                    <button
                      onClick={() => handleToggle(u)}
                      disabled={toggling === u.id}
                      title={u.estado === 1 ? "Desactivar usuario" : "Activar usuario"}
                      className="flex items-center gap-1.5 text-xs font-medium transition disabled:opacity-50"
                    >
                      {u.estado === 1 ? (
                        <>
                          <ToggleRight className="h-6 w-6 text-emerald-500" />
                          <span className="text-emerald-600">Activo</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                          <span className="text-gray-400">Inactivo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Página {page} de {totalPaginas}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
                  disabled={page === totalPaginas || loading}
                  className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
