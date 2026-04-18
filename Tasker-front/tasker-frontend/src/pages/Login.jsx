import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wrench, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "trabajador") navigate("/dashboard/trabajador");
      else navigate("/dashboard/cliente");
    } catch (err) {
      setError(err.response?.data?.error || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — decorativo */}
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
          Conecta con los mejores profesionales
        </h2>
        <p className="text-center text-white/80 text-lg max-w-sm">
          Miles de expertos listos para ayudarte con cualquier servicio que
          necesites.
        </p>
        <div className="mt-12 grid grid-cols-3 gap-8 text-center">
          {[
            ["500+", "Proveedores"],
            ["10K+", "Servicios"],
            ["4.8★", "Calificación"],
          ].map(([v, l]) => (
            <div key={l}>
              <p className="text-3xl font-extrabold">{v}</p>
              <p className="text-white/70 text-sm mt-1">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Tasker</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Bienvenido de vuelta
            </h1>
            <p className="text-gray-500 text-sm mb-8">
              Ingresa tus datos para continuar
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="tu@correo.com"
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="Tu contraseña"
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
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
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              ¿No tienes cuenta?{" "}
              <Link
                to="/register"
                className="text-primary font-medium hover:underline"
              >
                Regístrate
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
