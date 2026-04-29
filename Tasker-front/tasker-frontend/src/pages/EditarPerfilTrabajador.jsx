import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function EditarPerfilTrabajador() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ descripcion: "", telefono: "" });
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // Pre-llenar con datos actuales del usuario
  useEffect(() => {
    if (user) {
      setForm({
        descripcion: "",
        telefono: user.telefono || "",
      });
    }
    // Cargar descripción del perfil trabajador
    api
      .get("/auth/me")
      .then((r) => {
        const u = r.data.data;
        setForm((prev) => ({
          ...prev,
          telefono: u.telefono || "",
        }));
      })
      .catch(() => {});
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");
    setLoading(true);
    try {
      await api.put("/trabajadores/perfil", {
        descripcion: form.descripcion || undefined,
        telefono: form.telefono || undefined,
      });
      setExito(true);
      setTimeout(() => navigate("/dashboard/trabajador"), 2000);
    } catch (err) {
      const status = err.response?.status;
      if (status === 429)
        setErrMsg("Demasiadas solicitudes, intenta más tarde.");
      else
        setErrMsg(err.response?.data?.error || "Error al actualizar el perfil");
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
        <h2 className="text-2xl font-bold text-gray-900">¡Perfil actualizado!</h2>
        <p className="text-gray-500">Los cambios se guardaron correctamente.</p>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div
            className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#10b981", borderTopColor: "transparent" }}
          />
          Redirigiendo...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            to="/dashboard/trabajador"
            className="p-2 rounded-lg hover:bg-gray-200 transition text-gray-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Actualiza tu información profesional
            </p>
          </div>
        </div>

        {/* Info del usuario (solo lectura) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Información de cuenta
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400">Nombre</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">
                {user?.nombre}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Correo</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario editable */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Perfil profesional
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Descripción de tu trabajo{" "}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                rows={4}
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
                placeholder="Cuéntale a los clientes sobre tu experiencia, especialidades y por qué contratarte..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Teléfono{" "}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) =>
                  setForm({ ...form, telefono: e.target.value })
                }
                placeholder="Ej: 312 123 4567"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
              />
            </div>

            {errMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {errMsg}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Link
                to="/dashboard/trabajador"
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
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
