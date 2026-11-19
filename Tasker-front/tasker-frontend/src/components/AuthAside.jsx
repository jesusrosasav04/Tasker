import { ShieldCheck, MessageSquare, Star } from "lucide-react";

// Panel decorativo de Login/Register (solo en pantallas grandes). Solo afirma lo que la plataforma sí hace.
const PUNTOS = [
  [ShieldCheck, "Especialistas con documentos revisados por nuestro equipo"],
  [MessageSquare, "Chat directo con quien hace el trabajo"],
  [Star, "Calificaciones de clientes que contrataron el servicio"],
];

export default function AuthAside({ titulo, subtitulo }) {
  return (
    <aside className="hidden flex-col justify-center bg-tinta p-12 text-crema lg:flex lg:w-1/2">
      <div className="mx-auto max-w-md">
        <p className="font-display text-5xl font-extrabold tracking-tighter">
          tasker<span className="text-teal-300">.</span>
        </p>
        <h2 className="mt-10 font-display text-4xl font-extrabold leading-tight tracking-tight">{titulo}</h2>
        <p className="mt-4 text-lg text-stone-300">{subtitulo}</p>
        <ul className="mt-10 space-y-3">
          {PUNTOS.map(([Icon, texto]) => (
            <li key={texto} className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 text-[15px] text-stone-200">
              <Icon className="h-5 w-5 flex-shrink-0 text-teal-300" />
              {texto}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
