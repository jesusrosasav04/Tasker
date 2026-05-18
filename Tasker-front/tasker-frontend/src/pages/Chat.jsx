import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Chat() {
  const { tarea_id }    = useParams();
  const { user }        = useAuth();
  const [mensajes, setMensajes]   = useState([]);
  const [texto, setTexto]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [enviando, setEnviando]   = useState(false);
  const [errMsg, setErrMsg]       = useState("");
  const bottomRef = useRef(null);

  const cargar = () => {
    api.get(`/mensajes/${tarea_id}`)
      .then((r) => setMensajes(r.data.data || []))
      .catch(() => setErrMsg("No se pudieron cargar los mensajes."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
    // Polling cada 5 segundos para mensajes nuevos
    const interval = setInterval(cargar, 5000);
    return () => clearInterval(interval);
  }, [tarea_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    setErrMsg("");
    try {
      const r = await api.post("/mensajes", { tarea_id: Number(tarea_id), mensaje: texto.trim() });
      setMensajes((prev) => [...prev, r.data.data]);
      setTexto("");
    } catch (err) {
      const status = err.response?.status;
      if (status === 400) setErrMsg(err.response.data.error);
      else if (status === 429) setErrMsg("Demasiadas solicitudes, espera un momento.");
      else setErrMsg("Error al enviar el mensaje.");
    } finally {
      setEnviando(false);
    }
  };

  const dashboardLink = user?.role === "trabajador"
    ? "/dashboard/trabajador"
    : "/dashboard/cliente";

  return (
    <div className="flex-1 flex flex-col bg-gray-50" style={{ height: "calc(100vh - 73px)" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <Link to={dashboardLink}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-semibold text-gray-900 text-sm">Chat de tarea #{tarea_id}</h1>
          <p className="text-xs text-gray-400 mt-0.5">Los mensajes se actualizan cada 5 segundos</p>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "#10b981", borderTopColor: "transparent" }} />
          </div>
        ) : errMsg ? (
          <p className="text-center text-sm text-red-500 py-10">{errMsg}</p>
        ) : mensajes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No hay mensajes aún</p>
            <p className="text-gray-300 text-xs mt-1">Sé el primero en escribir</p>
          </div>
        ) : (
          mensajes.map((m) => {
            const esMio = m.remitente_id === user?.id;
            return (
              <div key={m.id} className={`flex ${esMio ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md ${esMio ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  {!esMio && (
                    <span className="text-xs text-gray-400 px-1">{m.remitente_nombre}</span>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    esMio
                      ? "text-white rounded-br-sm"
                      : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                  }`}
                    style={esMio ? { backgroundColor: "#10b981" } : {}}>
                    {m.mensaje}
                  </div>
                  <span className="text-xs text-gray-400 px-1">
                    {new Date(m.created_at).toLocaleTimeString("es-MX", {
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
        {errMsg && !loading && (
          <p className="text-xs text-red-500 mb-2">{errMsg}</p>
        )}
        <form onSubmit={handleEnviar} className="flex items-center gap-3">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe un mensaje..."
            maxLength={1000}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button type="submit" disabled={enviando || !texto.trim()}
            style={{ backgroundColor: "#10b981" }}
            className="p-2.5 rounded-xl text-white hover:opacity-90 transition disabled:opacity-40">
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
