import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, MailCheck } from "lucide-react";
import api from "../api/axios";

// Paso 1: pedir el enlace de recuperación
export default function RecuperarPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [enviado, setEnviado] = useState(null); // { message, dev_enlace? }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setErrMsg("");
    try {
      const r = await api.post("/auth/forgot-password", { email });
      setEnviado({ message: r.data.message, dev_enlace: r.data.data?.dev_enlace });
    } catch (err) {
      setErrMsg(err.response?.data?.error || "No se pudo procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center bg-crema px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-arena bg-white p-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-tinta">¿Olvidaste tu contraseña?</h1>

        {enviado ? (
          <div className="mt-6">
            <MailCheck className="mb-3 h-10 w-10 text-primary" />
            <p className="text-sm text-piedra">{enviado.message}</p>
            {enviado.dev_enlace && (
              // Solo en desarrollo: aún no hay correo configurado en el backend
              <div className="mt-4 rounded-2xl border border-dashed border-arena bg-crema p-4 text-xs text-piedra">
                <p className="font-semibold text-tinta">Modo desarrollo (sin correo)</p>
                <a href={enviado.dev_enlace} className="mt-1 block break-all text-primary underline">{enviado.dev_enlace}</a>
              </div>
            )}
            <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <p className="text-sm text-piedra">Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.</p>
            <label className="block text-sm font-medium text-tinta">
              Correo electrónico
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
                className="mt-1 block w-full rounded-xl border border-arena bg-crema px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </label>
            {errMsg && (
              <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />{errMsg}
              </p>
            )}
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50">
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
            <p className="text-center text-sm text-piedra">
              <Link to="/login" className="font-semibold text-tinta hover:text-primary">Volver a iniciar sesión</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
