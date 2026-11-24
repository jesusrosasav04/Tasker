import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const SECCIONES = [
  {
    titulo: "1. Quién es responsable de tus datos",
    texto: [
      "Tasker, con domicilio en Colima, Colima, México, es responsable del uso y protección de los datos personales que nos proporcionas al usar la plataforma.",
    ],
  },
  {
    titulo: "2. Qué datos recabamos",
    lista: [
      "Identificación y contacto: nombre, correo electrónico y teléfono.",
      "Si eres especialista: CURP, identificación oficial y los documentos que subas para verificar tu perfil, además de tus categorías de servicio y descripción.",
      "De las tareas: descripción, presupuesto, ubicación que captures y fotos de evidencia del trabajo terminado.",
      "De la actividad en la plataforma: mensajes del chat, calificaciones, reportes y registro de pagos.",
      "Si inicias sesión con Google, recibimos tu nombre y correo de tu cuenta de Google.",
    ],
    texto: ["No solicitamos datos personales sensibles."],
  },
  {
    titulo: "3. Para qué los usamos",
    texto: ["Finalidades necesarias para darte el servicio:"],
    lista: [
      "Crear y administrar tu cuenta.",
      "Verificar la identidad de los especialistas y evitar cuentas duplicadas o falsas.",
      "Conectar a clientes con especialistas: publicar tareas, postularse, chatear y calificar.",
      "Atender reportes, disputas y solicitudes de soporte.",
      "Procesar la compra de créditos y llevar el historial de tus movimientos.",
      "Prevenir fraudes y cumplir obligaciones legales.",
    ],
    extra: "Finalidad adicional (puedes negarte sin que afecte el servicio): enviarte avisos sobre novedades de Tasker. Para negarte, escríbenos desde Soporte.",
  },
  {
    titulo: "4. Con quién los compartimos",
    lista: [
      "Con otros usuarios, solo lo necesario: el cliente ve el nombre, calificaciones y datos de contacto del especialista asignado, y viceversa. Tu CURP e identificación nunca se muestran a otros usuarios.",
      "Con Stripe, que procesa los pagos con tarjeta. Tasker no recibe ni guarda los datos de tu tarjeta.",
      "Con Google, únicamente si eliges iniciar sesión con tu cuenta de Google.",
      "Con autoridades, cuando una ley o una orden judicial lo exija.",
    ],
  },
  {
    titulo: "5. Cómo los protegemos",
    texto: [
      "Tus contraseñas se guardan cifradas de forma irreversible, la información sensible de la plataforma se cifra y tus documentos de identidad solo pueden verlos tú y el equipo de verificación.",
    ],
  },
  {
    titulo: "6. Tus derechos ARCO",
    texto: [
      "Tienes derecho a Acceder a tus datos, Rectificarlos si son inexactos, Cancelarlos cuando consideres que no se usan correctamente y Oponerte a su uso para fines específicos. También puedes revocar tu consentimiento.",
      "Para ejercerlos, envía tu solicitud desde la sección Soporte de Tasker indicando tu nombre, el derecho que quieres ejercer y una forma de acreditar tu identidad. Te responderemos en un plazo máximo de 20 días hábiles.",
      "Si consideras que tu derecho a la protección de datos fue vulnerado, puedes acudir a la autoridad competente en la materia.",
    ],
  },
  {
    titulo: "7. Cookies",
    texto: [
      "Usamos una cookie de sesión estrictamente necesaria para mantenerte conectado de forma segura. No usamos cookies de publicidad ni de rastreo.",
    ],
  },
  {
    titulo: "8. Cambios a este aviso",
    texto: [
      "Si modificamos este aviso, publicaremos la versión actualizada en esta página e indicaremos la fecha del cambio.",
    ],
  },
];

export default function AvisoPrivacidad() {
  return (
    <main className="flex-1 bg-crema">
      <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-piedra hover:text-tinta">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>

        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-primary">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight">Aviso de privacidad</h1>
            <p className="mt-1 text-sm text-piedra">Integral · Última actualización: noviembre de 2026</p>
          </div>
        </div>

        <p className="mt-6 leading-relaxed text-tinta">
          En cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los
          Particulares, te informamos cómo tratamos tus datos personales cuando usas Tasker.
        </p>

        <div className="mt-8 space-y-4">
          {SECCIONES.map((s) => (
            <section key={s.titulo} className="rounded-3xl border border-arena bg-white p-6">
              <h2 className="font-display text-xl font-extrabold tracking-tight">{s.titulo}</h2>
              {s.texto?.map((t) => (
                <p key={t} className="mt-3 leading-relaxed text-piedra">{t}</p>
              ))}
              {s.lista && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-piedra marker:text-primary">
                  {s.lista.map((i) => <li key={i} className="leading-relaxed">{i}</li>)}
                </ul>
              )}
              {s.extra && <p className="mt-3 rounded-2xl bg-crema px-4 py-3 text-sm text-piedra">{s.extra}</p>}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
