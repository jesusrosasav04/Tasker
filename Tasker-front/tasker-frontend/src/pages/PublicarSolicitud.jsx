import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CheckCircle } from "lucide-react";
import api from "../api/axios";

export default function PublicarSolicitud() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [form, setForm] = useState({
    Titulo: "",
    Descripcion: "",
    CategoriaID: "",
    direccion: "",
    MontoAcordado: "",
  });

  useEffect(() => {
    api.get("/categorias").then((r) => setCategorias(r.data.data || []));
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");
    if (!form.Titulo || !form.Descripcion || !form.CategoriaID) {
      setErrMsg("Título, descripción y categoría son obligatorios");
      return;
    }
    if (!localStorage.getItem("token")) {
      setErrMsg("Debes iniciar sesión para publicar una solicitud");
      return;
    }
    setLoading(true);
    try {
      await api.post("/tareas", form);
      setExito(true);
      setTimeout(() => navigate("/proveedores"), 2500);
    } catch (err) {
      setErrMsg(err.response?.data?.error || "Error al publicar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  if (exito)
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Solicitud enviada</h2>
        <p className="text-gray-500">
          Tu solicitud ha sido recibida. Un proveedor se pondrá en contacto
          contigo pronto.
        </p>
      </div>
    );

  return (
    <div className="flex-1 px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Solicitar servicio
          </h1>
          <p className="mt-2 text-gray-500">
            Describe lo que necesitas y recibe ofertas de profesionales
          </p>
        </div>

        <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">
              Solicitar un servicio
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Completa el formulario y recibe ofertas de proveedores cercanos
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Título
                </label>
                <input
                  name="Titulo"
                  value={form.Titulo}
                  onChange={handleChange}
                  placeholder="Ej: Reparación de tubería en cocina"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Tipo de servicio
                </label>
                <select
                  name="CategoriaID"
                  value={form.CategoriaID}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecciona un servicio</option>
                  {categorias.map((c) => (
                    <option key={c.CategoriaID} value={c.CategoriaID}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Descripción del problema
                </label>
                <textarea
                  name="Descripcion"
                  value={form.Descripcion}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe el servicio que necesitas con el mayor detalle posible..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Ubicación
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    name="direccion"
                    value={form.direccion}
                    onChange={handleChange}
                    placeholder="Ingresa tu dirección"
                    className="w-full pl-10 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Presupuesto estimado{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  name="MontoAcordado"
                  value={form.MontoAcordado}
                  onChange={handleChange}
                  placeholder="Ej: $500 - $1,000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {errMsg && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                  {errMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm"
              >
                {loading ? "Enviando..." : "Enviar solicitud"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
