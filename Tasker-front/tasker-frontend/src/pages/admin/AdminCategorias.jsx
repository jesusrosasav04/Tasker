import { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import api from "../../api/axios";
import AdminLayout from "./AdminLayout";

// ── Modal crear / editar ──────────────────────────────
function ModalCategoria({ categoria, onClose, onGuardado }) {
  const esEdicion = !!categoria;
  const [form, setForm] = useState({
    nombre: categoria?.nombre || "",
    descripcion: categoria?.descripcion || "",
  });
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");
    setLoading(true);
    try {
      if (esEdicion) {
        await api.put(`/admin/categorias/${categoria.id}`, form);
      } else {
        await api.post("/admin/categorias", form);
      }
      onGuardado();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setErrMsg("Ya existe una categoría con ese nombre.");
      else if (status === 429) setErrMsg("Demasiadas solicitudes, intenta más tarde.");
      else setErrMsg(err.response?.data?.error || "Error al guardar la categoría.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            {esEdicion ? "Editar categoría" : "Nueva categoría"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
              minLength={2}
              maxLength={100}
              placeholder="Ej: Plomería, Electricidad..."
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Descripción{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              maxLength={255}
              placeholder="Describe brevemente esta categoría..."
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {form.descripcion.length}/255
            </p>
          </div>

          {errMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {errMsg}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: "#10b981" }}
              className="flex-1 text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear categoría"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal confirmación eliminar ───────────────────────
function ModalEliminar({ categoria, onClose, onEliminado }) {
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const handleEliminar = async () => {
    setLoading(true);
    setErrMsg("");
    try {
      await api.delete(`/admin/categorias/${categoria.id}`);
      onEliminado();
    } catch (err) {
      setErrMsg(err.response?.data?.error || "Error al eliminar la categoría.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mb-4">
          <Trash2 className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">Eliminar categoría</h3>
        <p className="text-sm text-gray-500 mb-4">
          ¿Estás seguro de que quieres eliminar{" "}
          <span className="font-medium text-gray-900">"{categoria.nombre}"</span>?
          Esta acción no se puede deshacer.
        </p>

        {errMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {errMsg}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleEliminar}
            disabled={loading}
            className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
          >
            {loading ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast de éxito ────────────────────────────────────
function Toast({ mensaje, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-bounce-in">
      <CheckCircle className="h-4 w-4 text-emerald-400" />
      {mensaje}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────
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

// ── Componente principal ──────────────────────────────
export default function AdminCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [toast, setToast] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const cargar = () => {
    setLoading(true);
    api
      .get("/admin/categorias")
      .then((r) => setCategorias(r.data.data || []))
      .catch(() => setErrMsg("Error al cargar categorías."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleToggle = async (cat) => {
    setToggling(cat.id);
    setErrMsg("");
    try {
      const r = await api.patch(`/admin/categorias/${cat.id}/estado`);
      setCategorias((prev) =>
        prev.map((c) =>
          c.id === cat.id ? { ...c, activo: r.data.data.activo } : c
        )
      );
      setToast(r.data.message);
    } catch (err) {
      setErrMsg(err.response?.data?.error || "Error al cambiar estado.");
    } finally {
      setToggling(null);
    }
  };

  const onGuardado = (msg = "Categoría guardada correctamente") => {
    setModalCrear(false);
    setModalEditar(null);
    setToast(msg);
    cargar();
  };

  const onEliminado = () => {
    setModalEliminar(null);
    setToast("Categoría eliminada correctamente");
    cargar();
  };

  const activas = categorias.filter((c) => c.activo === 1).length;
  const inactivas = categorias.filter((c) => c.activo === 0).length;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {categorias.length} en total ·{" "}
              <span className="text-emerald-600">{activas} activas</span>
              {inactivas > 0 && (
                <span className="text-gray-400"> · {inactivas} inactivas</span>
              )}
            </p>
          </div>
          <button
            onClick={() => setModalCrear(true)}
            style={{ backgroundColor: "#10b981" }}
            className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            Nueva categoría
          </button>
        </div>

        {errMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {errMsg}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Cabecera tabla */}
          <div className="hidden sm:grid grid-cols-[1fr_2fr_80px_80px_100px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>Nombre</span>
            <span>Descripción</span>
            <span className="text-center">Tareas</span>
            <span className="text-center">Estado</span>
            <span className="text-right">Acciones</span>
          </div>

          {loading ? (
            <Spinner />
          ) : categorias.length === 0 ? (
            <div className="text-center py-16">
              <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No hay categorías aún</p>
              <p className="text-gray-400 text-sm mt-1">
                Crea la primera para que los clientes puedan publicar tareas
              </p>
              <button
                onClick={() => setModalCrear(true)}
                style={{ backgroundColor: "#10b981" }}
                className="inline-flex items-center gap-2 mt-4 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition"
              >
                <Plus className="h-4 w-4" />
                Crear categoría
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {categorias.map((cat) => (
                <div
                  key={cat.id}
                  className={`grid grid-cols-1 sm:grid-cols-[1fr_2fr_80px_80px_100px] gap-2 sm:gap-4 px-6 py-4 items-center hover:bg-gray-50 transition ${
                    cat.activo === 0 ? "opacity-50" : ""
                  }`}
                >
                  {/* Nombre */}
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 flex-shrink-0">
                      <Tag className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {cat.nombre}
                    </span>
                  </div>

                  {/* Descripción */}
                  <p className="hidden sm:block text-sm text-gray-500 truncate">
                    {cat.descripcion || (
                      <span className="italic text-gray-300">Sin descripción</span>
                    )}
                  </p>

                  {/* Total tareas */}
                  <div className="hidden sm:flex justify-center">
                    <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full">
                      {cat.total_tareas}
                    </span>
                  </div>

                  {/* Toggle estado */}
                  <div className="hidden sm:flex justify-center">
                    <button
                      onClick={() => handleToggle(cat)}
                      disabled={toggling === cat.id}
                      title={cat.activo === 1 ? "Desactivar" : "Activar"}
                      className="disabled:opacity-50 transition"
                    >
                      {cat.activo === 1 ? (
                        <ToggleRight className="h-7 w-7 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setModalEditar(cat)}
                      title="Editar"
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setModalEliminar(cat)}
                      title="Eliminar"
                      disabled={cat.total_tareas > 0}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nota informativa */}
        {!loading && categorias.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 text-center">
            💡 Las categorías con tareas asociadas no pueden eliminarse, solo desactivarse.
          </p>
        )}
      </div>

      {/* Modales */}
      {modalCrear && (
        <ModalCategoria onClose={() => setModalCrear(false)} onGuardado={onGuardado} />
      )}
      {modalEditar && (
        <ModalCategoria
          categoria={modalEditar}
          onClose={() => setModalEditar(null)}
          onGuardado={onGuardado}
        />
      )}
      {modalEliminar && (
        <ModalEliminar
          categoria={modalEliminar}
          onClose={() => setModalEliminar(null)}
          onEliminado={onEliminado}
        />
      )}

      {/* Toast */}
      {toast && <Toast mensaje={toast} onClose={() => setToast("")} />}
    </AdminLayout>
  );
}
