import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthAside from "../components/AuthAside";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function Register() {
  const { register } = useAuth();
  const navigate      = useNavigate();
  const location      = useLocation();
  const redirectTo    = new URLSearchParams(location.search).get("redirect") || null;

  const [step, setStep]         = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [categorias, setCategorias] = useState([]);

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    role: "",
    descripcion: "",
    categoriasSeleccionadas: [],
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleStep1 = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.role) { setError("Selecciona un rol para continuar"); return; }
    if (form.role === "trabajador") {
      try {
        const r = await api.get("/categorias");
        setCategorias(r.data.data || []);
      } catch {}
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
        nombre:     form.nombre.trim(),
        email:      form.email.trim(),
        password:   form.password,
        role:       form.role,
        categorias: form.role === "trabajador" ? form.categoriasSeleccionadas : undefined,
      });
      if (redirectTo) navigate(redirectTo);
      else if (user.role === "trabajador") navigate("/dashboard/trabajador");
      else navigate("/dashboard/cliente");
    } catch (err) {
      setError(err.response?.data?.error || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <AuthAside
        titulo="Únete a la comunidad"
        subtitulo="Ofrece tus servicios o encuentra al especialista ideal para cada tarea."
      />

      {/* Panel derecho */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-crema">
        <div className="w-full max-w-md">

          <div className="bg-white rounded-2xl shadow-sm border border-arena p-8">
            <h1 className="font-display text-2xl font-bold text-tinta mb-1">
              {step === 1 ? "Crear cuenta" : "Perfil de trabajador"}
            </h1>
            <p className="text-piedra text-sm mb-6">
              {step === 1 ? "Completa tus datos para empezar" : "Cuéntanos sobre tus servicios"}
            </p>

            {/* Pasos (solo para trabajador) */}
            {form.role === "trabajador" && (
              <div className="flex items-center gap-2 mb-6">
                {[1,2].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      step >= s ? "bg-primary text-white" : "bg-stone-200 text-piedra"
                    }`}>
                      {s}
                    </div>
                    {s < 2 && <div className={`h-0.5 w-8 ${step > s ? "bg-primary" : "bg-stone-200"}`} />}
                  </div>
                ))}
              </div>
            )}

            {/* PASO 1 */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-1.5">Nombre completo</label>
                  <input name="nombre" value={form.nombre} onChange={handleChange}
                    placeholder="Juan García" required
                    className="w-full border border-arena rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-1.5">Correo electrónico</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="tu@correo.com" required
                    className="w-full border border-arena rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-1.5">Contraseña</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} name="password"
                      value={form.password} onChange={handleChange}
                      placeholder="Mínimo 6 caracteres" required minLength={6}
                      className="w-full border border-arena rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-2">¿Cómo quieres usar Tasker?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "cliente",    label: "🧑 Soy cliente",    desc: "Necesito servicios" },
                      { value: "trabajador", label: "👷 Soy trabajador", desc: "Ofrezco servicios"  },
                    ].map((r) => (
                      <button key={r.value} type="button"
                        onClick={() => setForm({ ...form, role: r.value })}
                        className={`border-2 rounded-xl p-4 text-left transition-all ${
                          form.role === r.value
                            ? "border-primary bg-menta"
                            : "border-arena hover:border-arena"
                        }`}>
                        <p className="font-medium text-tinta text-sm">{r.label}</p>
                        <p className="text-xs text-piedra mt-0.5">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="bg-primary hover:bg-primary-dark w-full text-white py-3 rounded-xl font-medium transition disabled:opacity-50 text-sm">
                  {loading ? "Creando cuenta..." : form.role === "trabajador" ? "Continuar →" : "Crear cuenta"}
                </button>

                {/* Divisor */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-arena" />
                  </div>
                  <div className="relative flex justify-center text-xs text-stone-400 bg-white px-3 w-fit mx-auto">
                    o regístrate con
                  </div>
                </div>

                {/* Google */}
                <button type="button"
                  onClick={() => {
                    const role = form.role || "cliente";
                    const base = `${API_URL}/auth/google?role=${role}`;
                    window.location.href = redirectTo
                      ? `${base}&redirect=${encodeURIComponent(redirectTo)}`
                      : base;
                  }}
                  className="w-full flex items-center justify-center gap-3 border border-arena rounded-xl py-3 text-sm font-medium text-stone-700 hover:bg-crema transition">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuar con Google
                </button>
              </form>
            )}

            {/* PASO 2 — Trabajador */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-2">
                    ¿En qué categorías ofreces servicios?
                  </label>
                  {categorias.length === 0 ? (
                    <p className="text-sm text-stone-400">Cargando categorías...</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {categorias.map((c) => (
                        <button key={c.id} type="button" onClick={() => toggleCategoria(c.id)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition border-2 ${
                            form.categoriasSeleccionadas.includes(c.id)
                              ? "border-primary bg-menta text-primary"
                              : "bg-white text-piedra border-arena hover:border-primary"
                          }`}>
                          {c.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-1.5">
                    Descripción <span className="text-stone-400 font-normal">(opcional)</span>
                  </label>
                  <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
                    rows={3} placeholder="Cuéntanos tu experiencia y especialidades..."
                    className="w-full border border-arena rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 border border-arena text-stone-700 py-3 rounded-xl font-medium hover:bg-crema transition text-sm">
                    ← Atrás
                  </button>
                  <button type="button" onClick={handleSubmit} disabled={loading}
                    className="bg-primary hover:bg-primary-dark flex-1 text-white py-3 rounded-xl font-medium transition disabled:opacity-50 text-sm">
                    {loading ? "Creando cuenta..." : "Finalizar"}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 text-center text-sm text-piedra">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Inicia sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
