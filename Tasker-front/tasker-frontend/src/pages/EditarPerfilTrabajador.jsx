import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Tag, AlertTriangle } from "lucide-react";
import MisDocumentos from "../components/MisDocumentos";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function EditarPerfilTrabajador() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]       = useState({ descripcion: "", telefono: "" });
  const [categorias, setCategorias]       = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [exito, setExito]         = useState(false);
  const [errMsg, setErrMsg]       = useState("");

  useEffect(() => {
    // Cargar datos actuales del perfil
    api.get("/auth/me").then((r) => {
      const u = r.data.data;
      setForm({ descripcion: u.descripcion || "", telefono: u.telefono || "" });
      if (u.categorias_ids) setSeleccionadas(u.categorias_ids);
    }).catch(() => setErrMsg("No se pudo cargar tu perfil. Refresca la página."));

    // Cargar todas las categorías
    api.get("/categorias").then((r) => setCategorias(r.data.data || [])).catch(() => setErrMsg("No se pudieron cargar las categorías. Refresca la página."));
  }, []);

  const toggleCategoria = (id) => {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");
    setLoading(true);
    try {
      await api.put("/trabajadores/perfil", {
        descripcion: form.descripcion || undefined,
        telefono:    form.telefono    || undefined,
        categorias:  seleccionadas,
      });
      setExito(true);
      setTimeout(() => navigate("/dashboard/trabajador"), 2000);
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) setErrMsg("Demasiadas solicitudes, intenta más tarde.");
      else setErrMsg(err.response?.data?.error || "Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  if (exito) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-menta">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold text-tinta">¡Perfil actualizado!</h2>
        <p className="text-piedra">Los cambios se guardaron correctamente.</p>
        <div className="flex items-center gap-2 text-sm text-stone-400">
          <div className="border-primary border-t-transparent w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
          Redirigiendo...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-crema px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-xl space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/dashboard/trabajador"
            className="p-2 rounded-lg hover:bg-stone-200 transition text-piedra">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-tinta">Mi perfil</h1>
            <p className="text-piedra text-sm mt-0.5">Actualiza tu información profesional</p>
          </div>
        </div>

        {/* Info de cuenta (solo lectura) */}
        <div className="bg-white rounded-2xl border border-arena p-6">
          <h2 className="font-display text-xs font-semibold text-stone-400 uppercase tracking-wide mb-4">Información de cuenta</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-stone-400">Nombre</p>
              <p className="text-sm font-medium text-tinta mt-0.5">{user?.nombre}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400">Correo</p>
              <p className="text-sm font-medium text-tinta mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Formulario perfil */}
        <div className="bg-white rounded-2xl border border-arena p-6">
          <h2 className="font-display text-xs font-semibold text-stone-400 uppercase tracking-wide mb-4">Perfil profesional</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-stone-700 block mb-1.5">
                Descripción <span className="text-stone-400 font-normal">(opcional)</span>
              </label>
              <textarea rows={3} value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Cuéntale a los clientes sobre tu experiencia..."
                className="w-full border border-arena rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none" />
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700 block mb-1.5">
                Teléfono <span className="text-stone-400 font-normal">(opcional)</span>
              </label>
              <input type="tel" value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="Ej: 312 123 4567"
                className="w-full border border-arena rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2" />
            </div>

            {/* Categorías */}
            <div>
              <label className="text-sm font-medium text-stone-700 block mb-2">
                <span className="flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-stone-400" />
                  Mis categorías de servicio
                </span>
              </label>
              {categorias.length === 0 ? (
                <p className="text-sm text-stone-400">Cargando categorías...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categorias.map((c) => {
                    const activa = seleccionadas.includes(c.id);
                    return (
                      <button key={c.id} type="button" onClick={() => toggleCategoria(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition ${
                          activa
                            ? "border-primary bg-menta text-primary"
                            : "border-arena text-piedra hover:border-arena"
                        }`}>
                        {c.nombre}
                      </button>
                    );
                  })}
                </div>
              )}
              {seleccionadas.length === 0 && (
                <p className="text-xs text-stone-400 mt-2">Selecciona al menos una categoría</p>
              )}
            </div>

            {errMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {errMsg}
              </div>
            )}

            <div className="flex gap-3">
              <Link to="/dashboard/trabajador"
                className="flex-1 text-center border border-arena text-stone-700 py-3 rounded-xl font-medium hover:bg-crema transition text-sm">
                Cancelar
              </Link>
              <button type="submit" disabled={loading}
                className="bg-primary hover:bg-primary-dark flex-1 text-white py-3 rounded-xl font-medium transition disabled:opacity-50 text-sm">
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>

        <MisDocumentos />
      </div>
    </div>
  );
}
