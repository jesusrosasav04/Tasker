import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, DollarSign, MapPin, AlertTriangle } from "lucide-react";
import api from "../api/axios";

export default function EditarTarea() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [cargando, setCargando]     = useState(true);
  const [exito, setExito]           = useState(false);
  const [errMsg, setErrMsg]         = useState("");

  const [form, setForm] = useState({
    titulo: "", descripcion: "", categoria_id: "",
    presupuesto: "", ubicacion: "",
  });

  useEffect(() => {
    // Cargar datos actuales de la tarea
    api.get(`/tareas/${id}`)
      .then((r) => {
        const t = r.data.data;
        if (t.estado !== "pendiente") {
          setErrMsg("Esta tarea ya no puede editarse porque fue aceptada o completada.");
          return;
        }
        setForm({
          titulo:       t.titulo       || "",
          descripcion:  t.descripcion  || "",
          categoria_id: "",
          presupuesto:  t.presupuesto  || "",
          ubicacion:    t.ubicacion    || "",
        });
      })
      .catch(() => setErrMsg("No se pudo cargar la tarea."))
      .finally(() => setCargando(false));

    api.get("/categorias")
      .then((r) => setCategorias(r.data.data || []))
      .catch(() => {});
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");
    if (form.titulo.trim().length < 5) {
      setErrMsg("El título debe tener al menos 5 caracteres");
      return;
    }
    setLoading(true);
    try {
      await api.put(`/tareas/${id}`, {
        titulo:       form.titulo.trim(),
        descripcion:  form.descripcion.trim(),
        ...(form.categoria_id && { categoria_id: form.categoria_id }),
        ...(form.presupuesto  && { presupuesto: parseFloat(form.presupuesto) }),
        ...(form.ubicacion    && { ubicacion: form.ubicacion.trim() }),
      });
      setExito(true);
      setTimeout(() => navigate("/dashboard/cliente"), 2000);
    } catch (err) {
      const status = err.response?.status;
      if (status === 400) setErrMsg(err.response.data.error);
      else if (status === 429) setErrMsg("Demasiadas solicitudes, intenta más tarde.");
      else setErrMsg(err.response?.data?.error || "Error al actualizar la tarea");
    } finally {
      setLoading(false);
    }
  };

  if (cargando) return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: "#10b981", borderTopColor: "transparent" }} />
    </div>
  );

  if (exito) return (
    <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
        <CheckCircle className="h-8 w-8 text-emerald-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">¡Tarea actualizada!</h2>
      <p className="text-gray-500">Los cambios se guardaron correctamente.</p>
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "#10b981", borderTopColor: "transparent" }} />
        Redirigiendo...
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-gray-50 px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link to="/dashboard/cliente"
            className="p-2 rounded-lg hover:bg-gray-200 transition text-gray-500">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar tarea</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Solo puedes editar tareas que aún no han sido aceptadas
            </p>
          </div>
        </div>

        {errMsg && !loading ? (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">No se puede editar</p>
              <p className="text-sm mt-1">{errMsg}</p>
              <Link to="/dashboard/cliente"
                className="inline-block mt-3 text-sm font-medium text-red-600 underline">
                Volver al dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Título <span className="text-red-400">*</span>
                </label>
                <input name="titulo" value={form.titulo} onChange={handleChange}
                  placeholder="Ej: Reparación de tubería en cocina"
                  required minLength={5}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Categoría{" "}
                  <span className="text-gray-400 font-normal">(opcional — deja vacío para no cambiar)</span>
                </label>
                <select name="categoria_id" value={form.categoria_id} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white">
                  <option value="">-- Mantener categoría actual --</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Descripción <span className="text-red-400">*</span>
                </label>
                <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
                  rows={4} required
                  placeholder="Describe con detalle qué necesitas..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Presupuesto <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input name="presupuesto" type="number" min="0" step="0.01"
                      value={form.presupuesto} onChange={handleChange}
                      placeholder="0.00"
                      className="w-full pl-9 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Ubicación <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input name="ubicacion" value={form.ubicacion} onChange={handleChange}
                      placeholder="Tu dirección o colonia"
                      className="w-full pl-9 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>
                </div>
              </div>

              {errMsg && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                  {errMsg}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Link to="/dashboard/cliente"
                  className="flex-1 text-center border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition text-sm">
                  Cancelar
                </Link>
                <button type="submit" disabled={loading}
                  style={{ backgroundColor: "#10b981" }}
                  className="flex-1 text-white py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 text-sm">
                  {loading ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
