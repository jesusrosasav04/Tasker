import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Wrench, Home as HomeIcon, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

// Oficios del carrusel (especialista)
const OFICIOS = [
  { img: "/bienvenida/carpintero.png", label: "Carpintería" },
  { img: "/bienvenida/electricista.png", label: "Electricidad" },
  { img: "/bienvenida/albanil.png", label: "Albañilería" },
  { img: "/bienvenida/plomero.png", label: "Plomería" },
];
// Escenas del carrusel (cliente)
const CLIENTE = [
  { img: "/bienvenida/cliente-fuga.png", label: "Encuentra ayuda" },
  { img: "/bienvenida/cliente-sillon.png", label: "Pide sin llamar" },
];

export default function Bienvenida() {
  const navigate = useNavigate();
  const { user, completarPerfil, logout } = useAuth();

  const [rol, setRol] = useState(null); // "cliente" | "trabajador" | null
  const [paso, setPaso] = useState(1); // 1: elegir rol · 2: categorías
  const [slide, setSlide] = useState(0);
  const [categorias, setCategorias] = useState([]);
  const [seleccion, setSeleccion] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  // Quien se registró con correo ya aceptó el aviso; quien entró con Google, no
  const debeAceptar = !user?.privacidad_aceptada;
  const [acepta, setAcepta] = useState(false);

  const esEsp = rol === "trabajador";
  const escenas = rol === "cliente" ? CLIENTE : OFICIOS;

  // Carrusel automático
  useEffect(() => {
    const t = setInterval(() => setSlide((s) => s + 1), 2400);
    return () => clearInterval(t);
  }, []);
  const actual = slide % escenas.length;

  // Categorías para el paso 2
  useEffect(() => {
    api.get("/categorias").then((r) => setCategorias(r.data.data || [])).catch(() => {});
  }, []);

  const toggleCat = (id) =>
    setSeleccion((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const irAlPanel = (role) =>
    navigate(role === "trabajador" ? "/dashboard/trabajador" : "/dashboard/cliente");

  const continuar = async () => {
    setError("");
    if (!rol) return;
    // Especialista pasa primero a elegir categorías
    if (rol === "trabajador" && paso === 1) {
      setPaso(2);
      return;
    }
    try {
      setGuardando(true);
      await completarPerfil(
        {
          ...(rol === "trabajador" ? { role: "trabajador", categorias: seleccion } : { role: "cliente" }),
          ...(acepta ? { acepta_privacidad: true } : {}),
        },
      );
      irAlPanel(rol);
    } catch (e) {
      setError(e?.response?.data?.error || "No se pudo guardar. Intenta de nuevo.");
      setGuardando(false);
    }
  };

  return (
    <main className="flex flex-1 flex-wrap bg-crema">
      {/* ── Izquierda: contenido ───────────────── */}
      <div className="flex min-w-0 flex-[1_1_560px] flex-col px-6 py-14 lg:px-12">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Wrench className="h-5 w-5 text-white" />
            </span>
            <span className="font-display text-2xl font-extrabold tracking-tight">
              tasker<span className="text-primary">.</span>
            </span>
          </div>
          <button
            onClick={logout}
            className="text-sm font-medium text-stone-500 transition hover:text-tinta"
          >
            Cerrar sesión
          </button>
        </div>

        {paso === 1 ? (
          <>
            {user?.email && (
              <span className="mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-arena bg-white px-3.5 py-2 text-sm text-piedra">
                Entraste como <strong className="font-semibold text-tinta">{user.email}</strong>
              </span>
            )}
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-[-0.03em] sm:text-5xl">
              ¡Ya casi estás dentro!
            </h1>
            <p className="mb-7 mt-3 text-lg text-piedra">¿Cómo quieres usar Tasker?</p>

            <div className="flex flex-col gap-3.5">
              <RolCard
                activo={rol === "cliente"}
                onClick={() => setRol("cliente")}
                icon={<HomeIcon className="h-6 w-6 text-tinta" />}
                titulo="Soy Cliente"
                desc="Necesito contratar a alguien para mi casa."
                tono="tinta"
              />
              <RolCard
                activo={rol === "trabajador"}
                onClick={() => setRol("trabajador")}
                icon={<Wrench className="h-6 w-6 text-primary" />}
                titulo="Soy Especialista"
                desc="Ofrezco mis servicios y recibo tareas."
                tono="primary"
              />
            </div>

            {debeAceptar && (
              <label className="mt-6 flex items-start gap-2.5 text-sm text-piedra">
                <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-primary" />
                <span>
                  He leído y acepto el{" "}
                  <Link to="/privacidad" target="_blank" className="font-medium text-primary hover:underline">
                    aviso de privacidad
                  </Link>.
                </span>
              </label>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <button
              onClick={continuar}
              disabled={!rol || guardando || (debeAceptar && !acepta)}
              className="mt-7 min-h-[54px] rounded-2xl bg-tinta text-base font-semibold text-crema transition enabled:hover:bg-stone-700 disabled:opacity-40"
            >
              {guardando ? "Guardando..." : "Continuar"}
            </button>
            <p className="mt-4 text-[13px] text-stone-500">
              Podrás cambiar esto más adelante desde tu perfil.
            </p>
          </>
        ) : (
          <>
            <div className="mb-7 flex items-center gap-2">
              <span className="h-1.5 flex-1 rounded-full bg-primary" />
              <span className="h-1.5 flex-1 rounded-full bg-primary" />
              <span className="ml-1.5 text-[13px] text-stone-500">Paso 2 de 2</span>
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-[-0.03em] sm:text-5xl">
              ¿En qué eres especialista?
            </h1>
            <p className="mb-7 mt-3 text-lg text-piedra">
              Elige una o más categorías. Así te mostramos las tareas que te corresponden.
            </p>

            <div className="flex flex-wrap gap-2.5">
              {categorias.map((c) => {
                const on = seleccion.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCat(c.id)}
                    className={`flex items-center gap-2 rounded-full border-2 px-[18px] py-3 text-[15px] font-semibold transition ${
                      on
                        ? "border-primary bg-teal-50 text-primary-dark"
                        : "border-arena bg-white text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    {on && <Check className="h-4 w-4" />}
                    {c.nombre}
                  </button>
                );
              })}
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setPaso(1)}
                className="min-h-[54px] rounded-2xl border border-arena bg-white px-6 text-base font-semibold text-tinta hover:border-stone-400"
              >
                Atrás
              </button>
              <button
                onClick={continuar}
                disabled={guardando || seleccion.length === 0}
                className="min-h-[54px] flex-1 rounded-2xl bg-tinta text-base font-semibold text-crema transition enabled:hover:bg-stone-700 disabled:opacity-40"
              >
                {guardando ? "Guardando..." : "Entrar a Tasker"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Derecha: ilustración ───────────────── */}
      <div
        className="relative flex min-h-[320px] min-w-0 flex-[1_1_440px] items-center justify-center overflow-hidden transition-colors duration-500"
        style={{ backgroundColor: rol === "cliente" ? "#faf7f2" : "#ecfdf5" }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(28,25,23,0.05) 1.5px, transparent 1.5px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative flex flex-col items-center p-12">
          <div className="relative h-[300px] w-[300px]">
            {escenas.map((e, i) => (
              <img
                key={e.img}
                src={e.img}
                alt={e.label}
                className="absolute inset-0 h-[300px] w-[300px] object-contain transition-opacity duration-500"
                style={{
                  opacity: i === actual ? 1 : 0,
                  filter: "drop-shadow(0 18px 30px rgba(28,25,23,0.14))",
                }}
              />
            ))}
          </div>
          <p className="mt-5 font-display text-[22px] font-bold">{escenas[actual].label}</p>
          <div className="mt-3 flex gap-1.5" style={{ opacity: esEsp || rol === null ? 1 : 0 }}>
            {escenas.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === actual ? 22 : 7,
                  backgroundColor: i === actual ? "#0f766e" : "#c7e9e2",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function RolCard({ activo, onClick, icon, titulo, desc, tono }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`flex items-center gap-[18px] rounded-[20px] border-2 p-[22px] text-left transition ${
        activo
          ? tono === "primary"
            ? "border-primary bg-teal-50 shadow-[0_0_0_4px_rgba(15,118,110,0.12)]"
            : "border-tinta bg-crema shadow-[0_0_0_4px_rgba(28,25,23,0.08)]"
          : "border-arena bg-white hover:border-stone-400"
      }`}
    >
      <span
        className={`flex h-[54px] w-[54px] flex-shrink-0 items-center justify-center rounded-[15px] ${
          activo ? (tono === "primary" ? "bg-menta" : "bg-arena") : "bg-crema"
        }`}
      >
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-[19px] font-bold">{titulo}</span>
        <span className="block text-[15px] leading-snug text-piedra">{desc}</span>
      </span>
      <span
        className={`flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full border-2 ${
          activo
            ? tono === "primary"
              ? "border-primary bg-primary"
              : "border-tinta bg-tinta"
            : "border-stone-300 bg-white"
        }`}
      >
        {activo && <Check className="h-[15px] w-[15px] text-white" strokeWidth={3} />}
      </span>
    </button>
  );
}
