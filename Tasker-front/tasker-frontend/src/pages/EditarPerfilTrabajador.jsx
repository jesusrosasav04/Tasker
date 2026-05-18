import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Tag, FileText, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const TIPOS_DOC = [
  { value: "identificacion", label: "Identificación oficial" },
  { value: "certificado",    label: "Certificado o diploma"  },
  { value: "titulo",         label: "Título profesional"     },
  { value: "otro",           label: "Otro documento"         },
];

export default function EditarPerfilTrabajador() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]       = useState({ descripcion: "", telefono: "" });
  const [categorias, setCategorias]       = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [documentos, setDocumentos]       = useState([]);
  const [nuevoDoc, setNuevoDoc]           = useState({ tipo: "identificacion", url: "" });
  const [loading, setLoading]     = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [exito, setExito]         = useState(false);
  const [errMsg, setErrMsg]       = useState("");
  const [errDoc, setErrDoc]       = useState("");

  useEffect(() => {
    // Cargar datos actuales del perfil
    api.get("/auth/me").then((r) => {
      const u = r.data.data;
      setForm({ descripcion: u.descripcion || "", telefono: u.telefono || "" });
      if (u.categorias_ids) setSeleccionadas(u.categorias_ids);
    }).catch(() => {});

    // Cargar todas las categorías
    api.get("/categorias").then((r) => setCategorias(r.data.data || [])).catch(() => {});

    // Cargar documentos del trabajador
    api.get("/documentos/mis-documentos")
      .then((r) => setDocumentos(r.data.data || []))
      .catch(() => {});
  }, []);

  const toggleCategoria = (id) => {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");
    setLoading(true);
    try {
      await api.put("/trabajadores/perfil", {
        descripcion: form.descripcion || undefined,
        telefono:    form.telefono    || undefined,
        categorias:  seleccionadas,
      });
      setExito(true);
      setTimeout(() => navigate("/dashboard/trabajador"), 2000);
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) setErrMsg("Demasiadas solicitudes, intenta más tarde.");
      else setErrMsg(err.response?.data?.error || "Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSubirDoc = async (e) => {
    e.preventDefault();
    setErrDoc("");
    if (!nuevoDoc.url.trim()) { setErrDoc("La URL es obligatoria"); return; }
    setLoadingDoc(true);
    try {
      const r = await api.post("/documentos", nuevoDoc);
      setDocumentos((prev) => [...prev, r.data.data]);
      setNuevoDoc({ tipo: "identificacion", url: "" });
    } catch (err) {
      setErrDoc(err.response?.data?.error || "Error al subir el documento");
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleEliminarDoc = async (id) => {
    try {
      await api.delete(`/documentos/${id}`);
      setDocumentos((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setErrDoc(err.response?.data?.error || "Error al eliminar el documento");
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
          <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#10b981", borderTopColor: "transparent" }} />
          Redirigiendo...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-xl space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/dashboard/trabajador"
            className="p-2 rounded-lg hover:bg-gray-200 transition text-gray-500">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
            <p className="text-gray-500 text-sm mt-0.5">Actualiza tu información profesional</p>
          </div>
        </div>

        {/* Info de cuenta (solo lectura) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Información de cuenta</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400">Nombre</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{user?.nombre}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Correo</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Formulario perfil */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Perfil profesional</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Descripción <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea rows={3} value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Cuéntale a los clientes sobre tu experiencia..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input type="tel" value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="Ej: 312 123 4567"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2" />
            </div>

            {/* Categorías */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                <span className="flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-gray-400" />
                  Mis categorías de servicio
                </span>
              </label>
              {categorias.length === 0 ? (
                <p className="text-sm text-gray-400">Cargando categorías...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categorias.map((c) => {
                    const activa = seleccionadas.includes(c.id);
                    return (
                      <button key={c.id} type="button" onClick={() => toggleCategoria(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition ${
                          activa
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}>
                        {c.nombre}
                      </button>
                    );
                  })}
                </div>
              )}
              {seleccionadas.length === 0 && (
                <p className="text-xs text-gray-400 mt-2">Selecciona al menos una categoría</p>
              )}
            </div>

            {errMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {errMsg}
              </div>
            )}

            <div className="flex gap-3">
              <Link to="/dashboard/trabajador"
                className="flex-1 text-center border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition text-sm">
                Cancelar
              </Link>
              <button type="submit" disabled={loading}
                style={{ backgroundColor: "#10b981" }}
                className="flex-1 text-white py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50 text-sm">
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>

        {/* Documentos */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            Mis documentos
          </h2>

          {/* Lista de documentos */}
          {documentos.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">No has subido documentos aún</p>
          ) : (
            <div className="space-y-2 mb-5">
              {documentos.map((d) => (
                <div key={d.id}
                  className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 capitalize">{d.tipo}</p>
                    <a href={d.url} target="_blank" rel="noreferrer"
                      className="text-xs text-emerald-600 truncate block hover:underline">{d.url}</a>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.verificado ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {d.verificado ? "Verificado" : "Pendiente"}
                    </span>
                    {!d.verificado && (
                      <button onClick={() => handleEliminarDoc(d.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Subir nuevo documento */}
          <form onSubmit={handleSubirDoc} className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Subir nuevo documento</p>
            <select value={nuevoDoc.tipo}
              onChange={(e) => setNuevoDoc({ ...nuevoDoc, tipo: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white">
              {TIPOS_DOC.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input type="url" value={nuevoDoc.url}
              onChange={(e) => setNuevoDoc({ ...nuevoDoc, url: e.target.value })}
              placeholder="https://... (URL del documento)"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2" />

            {errDoc && (
              <p className="text-xs text-red-500">{errDoc}</p>
            )}

            <button type="submit" disabled={loadingDoc}
              className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50">
              {loadingDoc ? "Subiendo..." : "+ Agregar documento"}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2">
            💡 Los documentos serán revisados y verificados por un administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
