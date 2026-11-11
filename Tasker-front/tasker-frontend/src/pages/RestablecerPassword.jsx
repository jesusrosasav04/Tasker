import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle } from "lucide-react";
import api from "../api/axios";

// Paso 2: crear la nueva contraseña con el token del enlace
export default function RestablecerPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [listo, setListo] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setErrMsg("La contraseña debe tener al menos 6 caracteres."); return; }
    if (password !== confirmar) { setErrMsg("Las contraseñas no coinciden."); return; }
    setLoading(true); setErrMsg("");
    try {
      await api.post("/auth/reset-password", { token, password });
      setListo(true);
    } catch (err) {
      setErrMsg(err.response?.data?.error || "No se pudo cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  const input = "mt-1 block w-full rounded-xl border border-arena bg-crema px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <main className="flex flex-1 items-center justify-center bg-crema px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-arena bg-white p-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-tinta">Nueva contraseña</h1>

        {!token ? (
          <p className="mt-6 text-sm text-piedra">
            Este enlace está incompleto.{" "}
            <Link to="/recuperar" className="font-semibold text-primary hover:underline">Solicita uno nuevo</Link>.
          </p>
        ) : listo ? (
          <div className="mt-6">
            <CheckCircle className="mb-3 h-10 w-10 text-primary" />
            <p className="text-sm text-piedra">Tu contraseña se actualizó.</p>
            <Link to="/login"
              className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark">
              Iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-tinta">
              Nueva contraseña
              <input type="password" required minLength={6} maxLength={72} value={password}
                onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={input} />
            </label>
            <label className="block text-sm font-medium text-tinta">
              Confirmar contraseña
              <input type="password" required value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)} autoComplete="new-password" className={input} />
            </label>
            {errMsg && (
              <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />{errMsg}
                {errMsg.includes("expiró") && <Link to="/recuperar" className="ml-1 font-semibold underline">Pedir otro</Link>}
              </p>
            )}
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50">
              {loading ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
