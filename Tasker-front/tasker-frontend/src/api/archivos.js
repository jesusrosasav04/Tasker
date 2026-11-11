import api from "./axios";

// Descarga un archivo protegido (requiere el Bearer token, por eso no sirve un <a href> ni <img src>)
// y devuelve una URL local (blob:) para mostrarlo. Quien la usa debe liberarla con URL.revokeObjectURL.
export async function urlProtegida(ruta) {
  const r = await api.get(ruta, { responseType: "blob" });
  return URL.createObjectURL(r.data);
}

// Abre un documento del trabajador en otra pestaña
export async function abrirDocumento(id) {
  const ventana = window.open("", "_blank"); // se abre antes del await para que el navegador no la bloquee
  try {
    const url = await urlProtegida(`/documentos/${id}/archivo`);
    if (ventana) ventana.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch {
    ventana?.close();
    throw new Error("No se pudo abrir el documento");
  }
}

export const TIPOS_DOCUMENTO = {
  identificacion: "Identificación oficial",
  certificado: "Certificado",
  titulo: "Título profesional",
  otro: "Otro",
};
