import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wrench, Eye, EyeOff, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categorias, setCategorias] = useState([]);

  const [form, setForm] = useState({
    nombre: "",
    apellidoP: "",
    email: "",
    password: "",
    role: "",
    biografia: "",
    categoriasSeleccionadas: [],
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleStep1 = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.role) {
      setError("Selecciona un rol");
      return;
    }
    if (form.role === "trabajador") {
      const r = await api.get("/categorias");
      setCategorias(r.data.data || []);
      setStep(2);
    } else {
      handleSubmit();
    }
  };

  const toggleCategoria = (id) => {
    const sel = form.categoriasSeleccionadas;
    setForm({
      ...form,
      categoriasSeleccionadas: sel.includes(id)
        ? sel.filter((x) => x !== id)
        : [...sel, id],
    });
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const user = await register({
        nombre: form.nombre,
        apellidoP: form.apellidoP,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      if (user.role === "trabajador") navigate("/dashboard/trabajador");
      else navigate("/dashboard/cliente");
    } catch (err) {
      setError(err.response?.data?.error || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-white"
        style={{
          background:
            "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
        }}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <span className="text-3xl font-bold">Tasker</span>
        </div>
        <h2 className="text-4xl font-extrabold text-center leading-tight mb-4">
          Únete a nuestra comunidad
        </h2>
        <p className="text-center text-white/80 text-lg max-w-sm">
          Ofrece tus servicios o encuentra el profesional ideal para cada tarea.
        </p>
        <div className="mt-12 space-y-4 w-full max-w-sm">
          {[
            ["🔒", "Pagos seguros con retención"],
            ["⭐", "Sistema de calificaciones verificadas"],
            ["💬", "Chat directo con proveedores"],
          ].map(([icon, text]) => (
            <div
              key={text}
              className="flex items-center gap-3 bg-white/10 rounded-xl p-4"
            >
              <span className="text-xl">{icon}</span>
              <span className="text-white/90 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Tasker</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {step === 1 ? "Crear cuenta" : "Perfil de trabajador"}
            </h1>
            <p className="text-gray-500 text-sm mb-8">
              {step === 1
                ? "Completa tus datos para empezar"
                : "Cuéntanos sobre tus servicios"}
            </p>

            {/* Indicador de pasos */}
            {form.role === "trabajador" && (
              <div className="flex items-center gap-2 mb-6">
                {[1, 2].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                        step >= s
                          ? "bg-primary text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {s}
                    </div>
                    {s < 2 && (
                      <div
                        className={`h-0.5 w-8 ${step > s ? "bg-primary" : "bg-gray-200"}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">
                      Nombre
                    </label>
                    <input
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      placeholder="Juan"
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">
                      Apellido
                    </label>
                    <input
                      name="apellidoP"
                      value={form.apellidoP}
                      onChange={handleChange}
                      placeholder="García"
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="tu@correo.com"
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    ¿Cómo quieres usar Tasker?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        value: "cliente",
                        label: "🧑 Soy cliente",
                        desc: "Necesito servicios",
                      },
                      {
                        value: "trabajador",
                        label: "👷 Soy trabajador",
                        desc: "Ofrezco servicios",
                      },
                    ].map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setForm({ ...form, role: r.value })}
                        className={`border-2 rounded-xl p-4 text-left transition-all ${
                          form.role === r.value
                            ? "border-primary bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-medium text-gray-900 text-sm">
                          {r.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ backgroundColor: "#10b981" }}
                  className="w-full text-white py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 text-sm"
                >
                  {loading
                    ? "Creando cuenta..."
                    : form.role === "trabajador"
                      ? "Continuar →"
                      : "Crear cuenta"}
                </button>
              </form>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    ¿En qué categorías ofreces servicios?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categorias.map((c) => (
                      <button
                        key={c.CategoriaID}
                        type="button"
                        onClick={() => toggleCategoria(c.CategoriaID)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                          form.categoriasSeleccionadas.includes(c.CategoriaID)
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-600 border-gray-300 hover:border-primary"
                        }`}
                      >
                        {c.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Descripción de tu trabajo{" "}
                    <span className="text-gray-400 font-normal">
                      (opcional)
                    </span>
                  </label>
                  <textarea
                    name="biografia"
                    value={form.biografia}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Cuéntanos tu experiencia y especialidades..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition text-sm"
                  >
                    ← Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{ backgroundColor: "#10b981" }}
                    className="flex-1 text-white py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 text-sm"
                  >
                    {loading ? "Creando cuenta..." : "Finalizar"}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 text-center text-sm text-gray-500">
              ¿Ya tienes cuenta?{" "}
              <Link
                to="/login"
                className="text-primary font-medium hover:underline"
              >
                Inicia sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
