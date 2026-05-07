import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wrench, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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
            ["500+", "Especialistas"],
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

            {/* Divisor */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400 bg-white px-3 w-fit mx-auto">
                o continúa con
              </div>
            </div>

            {/* Botón Google */}
            <button
              type="button"
              onClick={() => {
                window.location.href = `${API_URL}/auth/google`;
              }}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Iniciar sesión con Google
            </button>

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
