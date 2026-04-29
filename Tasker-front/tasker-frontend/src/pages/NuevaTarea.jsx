import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, MapPin, DollarSign } from "lucide-react";
import api from "../api/axios";

export default function NuevaTarea() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    categoria_id: "",
    presupuesto: "",
    ubicacion: "",
  });

  useEffect(() => {
    api
      .get("/categorias")
      .then((r) => setCategorias(r.data.data || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");

    if (form.titulo.trim().length < 5) {
      setErrMsg("El título debe tener al menos 5 caracteres");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        categoria_id: form.categoria_id,
        ...(form.presupuesto && { presupuesto: parseFloat(form.presupuesto) }),
        ...(form.ubicacion && { ubicacion: form.ubicacion.trim() }),
      };

      await api.post("/tareas", payload);
      setExito(true);
      setTimeout(() => navigate("/dashboard/cliente"), 2000);
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        setErrMsg("Demasiadas solicitudes, intenta más tarde.");
      } else {
        setErrMsg(err.response?.data?.error || "Error al crear la tarea");
      }
    } finally {
      setLoading(false);
    }
  };

  if (exito) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">¡Tarea creada!</h2>
        <p className="text-gray-500 text-center max-w-sm">
          Tu tarea fue publicada. Los trabajadores disponibles podrán postularse
          en breve.
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Redirigiendo...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            to="/dashboard/cliente"
            className="p-2 rounded-lg hover:bg-gray-200 transition text-gray-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva tarea</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Publica lo que necesitas y recibe postulaciones
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Título */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Título <span className="text-red-400">*</span>
              </label>
              <input
                name="titulo"
                value={form.titulo}
                onChange={handleChange}
                placeholder="Ej: Reparación de tubería en cocina"
                required
                minLength={5}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": "#10b981" }}
              />
              <p className="text-xs text-gray-400 mt-1">Mínimo 5 caracteres</p>
            </div>

            {/* Categoría */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Categoría <span className="text-red-400">*</span>
              </label>
              <select
                name="categoria_id"
                value={form.categoria_id}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white"
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Descripción <span className="text-red-400">*</span>
              </label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows={4}
                required
                placeholder="Describe con detalle qué necesitas, incluyendo materiales, acceso, urgencia, etc."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none"
              />
            </div>

            {/* Presupuesto y Ubicación en fila */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Presupuesto{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    name="presupuesto"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.presupuesto}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full pl-9 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Ubicación{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    name="ubicacion"
                    value={form.ubicacion}
                    onChange={handleChange}
                    placeholder="Tu dirección o colonia"
                    className="w-full pl-9 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
              </div>
            </div>

            {errMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {errMsg}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Link
                to="/dashboard/cliente"
                className="flex-1 text-center border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition text-sm"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: "#10b981" }}
                className="flex-1 text-white py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 text-sm"
              >
                {loading ? "Publicando..." : "Publicar tarea"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
