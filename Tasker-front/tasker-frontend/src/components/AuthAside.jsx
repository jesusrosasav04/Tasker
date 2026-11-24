import { useState, useEffect } from "react";
import { ShieldCheck, MessageSquare, Star } from "lucide-react";

// Panel lateral de Login/Register (solo en pantallas grandes).
// Carrusel: tarjeta de marca + fotos reales de servicios.
const PUNTOS = [
  [ShieldCheck, "Especialistas con documentos revisados por nuestro equipo"],
  [MessageSquare, "Chat directo con quien hace el trabajo"],
  [Star, "Calificaciones de clientes que contrataron el servicio"],
];

const FOTOS = [
  "/auth/grupo.jpg",
  "/auth/carpintero.jpg",
  "/auth/plomero.jpg",
  "/auth/electricista.jpg",
  "/auth/cliente.jpg",
];

export default function AuthAside({ titulo, subtitulo }) {
  const total = FOTOS.length + 1; // tarjeta de marca + fotos
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % total), 4500);
    return () => clearInterval(t);
  }, [total]);

  return (
    <aside className="relative hidden flex-col justify-center overflow-hidden bg-tinta p-12 text-crema lg:flex lg:w-1/2">
      {/* Tarjeta de marca (en flujo: define la altura del panel) */}
      <div className="relative z-10 mx-auto max-w-md transition-opacity duration-700" style={{ opacity: slide === 0 ? 1 : 0 }}>
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

      {/* Fotos (superpuestas) */}
      {FOTOS.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: slide === i + 1 ? 1 : 0 }}
          aria-hidden={slide !== i + 1}
        >
          <img src={src} alt="" className="h-full w-full object-contain" />
          <div className="absolute inset-0 bg-gradient-to-t from-tinta/70 via-transparent to-transparent" />
          <p className="absolute left-12 top-12 font-display text-3xl font-extrabold tracking-tighter text-white drop-shadow">
            tasker<span className="text-teal-300">.</span>
          </p>
        </div>
      ))}

      {/* Puntos del carrusel */}
      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ir al panel ${i + 1}`}
            onClick={() => setSlide(i)}
            className="h-2 rounded-full transition-all"
            style={{
              width: slide === i ? 22 : 8,
              backgroundColor: slide === i ? "#5eead4" : "rgba(255,255,255,0.35)",
            }}
          />
        ))}
      </div>
    </aside>
  );
}
